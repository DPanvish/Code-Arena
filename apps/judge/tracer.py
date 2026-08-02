import sys
import json
import tempfile
import os

def build_tracer(user_script_path, snapshots):
    def trace_calls(frame, event, arg):
        if event != 'line':
            return trace_calls

        # Ignore trace inside python standard library or our own code except the user code
        if frame.f_code.co_filename != user_script_path:
            return trace_calls

        line_no = frame.f_lineno
        
        # Capture local variables
        locals_dict = frame.f_locals
        variables = {}
        for name, value in locals_dict.items():
            if not name.startswith('__'):
                try:
                    val_type = type(value).__name__
                    if val_type == 'list':
                        try:
                            str_val = json.dumps(value)
                        except Exception:
                            str_val = repr(value)
                    else:
                        str_val = repr(value)
                        
                    variables[name] = {
                        "type": val_type,
                        "value": str_val
                    }
                except Exception:
                    variables[name] = {
                        "type": type(value).__name__,
                        "value": "<unrepresentable>"
                    }
                    
        # Capture stack
        stack = []
        f = frame
        while f:
            if f.f_code.co_filename == user_script_path:
                stack.insert(0, {
                    "function": f.f_code.co_name,
                    "line": f.f_lineno
                })
            f = f.f_back
            
        snapshot = {
            "line": line_no,
            "variables": variables,
            "stack": stack
        }
        
        snapshots.append(snapshot)
        return trace_calls
    return trace_calls

if __name__ == "__main__":
    # The code to trace should be passed via stdin to handle large programs safely
    code = sys.stdin.read()
    snapshots = []
    
    # Write code to a temp file to execute so the frames map to a filename
    fd, user_script_path = tempfile.mkstemp(suffix=".py")
    with os.fdopen(fd, 'w') as f:
        f.write(code)
        
    try:
        tracer_func = build_tracer(user_script_path, snapshots)
        sys.settrace(tracer_func)
        try:
            # We use compile & exec to run it in a clean namespace
            compiled_code = compile(code, user_script_path, 'exec')
            exec(compiled_code, {"__name__": "__main__", "__file__": user_script_path})
        except Exception as e:
            import traceback
            tb = sys.exc_info()[2]
            err_line = None
            for frame_summary in traceback.extract_tb(tb):
                if frame_summary.filename == user_script_path:
                    err_line = frame_summary.lineno
            snapshots.append({
                "error": str(e),
                "type": type(e).__name__,
                "line": err_line
            })
        finally:
            sys.settrace(None)
    finally:
        os.remove(user_script_path)
        
    print(json.dumps(snapshots))
