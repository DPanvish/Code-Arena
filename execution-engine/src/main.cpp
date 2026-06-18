#include <iostream>
#include <string>
#include <fstream>
#include <memory>
#include <stdexcept>
#include <array>

using namespace std;

string executeCommand(const char* cmd){
    array<char, 128> buffer;
    string result;
    unique_ptr<FILE, decltype(&pclose)> pipe(popen(cmd, "r"), pclose);
    
    if(!pipe){
        throw runtime_error("popen() failed!");
    }
    
    while(fgets(buffer.data(), buffer.size(), pipe.get()) != nullptr){
        result += buffer.data();
    }
    return result;
}


int main(int argc, char* argv[]) {
    // Basic argument check: Expected format -> ./engine <language> <source_file_path>
    if(argc < 3){
        std::cerr << "Usage: " << argv[0] << " <language> <source_file_path>\n";
        return 1;
    }

    string language = argv[1];
    string sourcePath = argv[2];
    string dockerCmd;

    // Construct the secure Docker command based on the language
    if(language == "cpp"){
        // Compile and run C++
        dockerCmd = "docker run --rm "
                    "--network none "                  // Prevent internet access (Anti-cheat)
                    "--memory=\"256m\" "               // Prevent RAM exhaustion
                    "--cpus=\"1.0\" "                  // Limit CPU usage
                    "-v " + sourcePath + ":/sandbox/main.cpp " // Mount the code
                    "codearena-sandbox /bin/bash -c 'g++ main.cpp -o main && ./main'";
    }else if(language == "python"){
        // Run Python directly
        dockerCmd = "docker run --rm "
                    "--network none "
                    "--memory=\"256m\" "
                    "--cpus=\"1.0\" "
                    "-v " + sourcePath + ":/sandbox/main.py "
                    "codearena-sandbox python3 main.py";
    }else{
        cerr << "Unsupported language." << "\n";
        return 1;
    }

    // Execute the container and capture stdout/stderr
    try{
        string executionOutput = executeCommand((dockerCmd + " 2>&1").c_str());
        cout << executionOutput; // Return the result back to the caller
    }catch(const std::exception& e){
        cerr << "Execution Error: " << e.what() << "\n";
        return 1;
    }

    return 0;
}