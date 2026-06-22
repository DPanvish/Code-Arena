import { exec } from "child_process";
import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import util from "util";

const execAsync = util.promisify(exec);

export const submitCode = async(req, res) => {
    const {code, language, problemId} = req.body;
    const fileExtension = language === 'cpp' ? 'cpp' : 'py'
    const filePath = path.join(__dirname, '../temp', filename);

    try {
        await fs.writeFile(filePath, code);

        const enginePath = path.join(__dirname, '../../execution-engine/engine');

        const command = `${enginePath} ${language} ${filePath}`;
        
        const { stdout, stderr } = await execAsync(command);

        await fs.unlink(filePath);

        if (stderr) {
             return res.status(400).json({ status: 'Error', output: stderr });
        }
        
        
        res.status(200).json({ status: 'Success', output: stdout });

    } catch (error) {

        try { await fs.unlink(filePath); } catch (e) { /* Ignore cleanup errors */ }
        
        res.status(500).json({ status: 'Server Error', message: error.message });
    }
}