import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface SourceFile {
    path: string;
    code: string;
}

export async function getAllSourceFilesWithCode(rootPath: string): Promise<SourceFile[]> {
    const sourceFiles: SourceFile[] = [];

    function traverseDirectory(dirPath: string) {
        const files = fs.readdirSync(dirPath);

        for (const file of files) {
            const fullPath = path.join(dirPath, file);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                if (!['node_modules', '.git', 'dist', 'build', '.vscode'].includes(file)) {
                    traverseDirectory(fullPath);
                }
            } else if (stat.isFile() && /\.(ts|js|tsx|jsx)$/.test(file)) {
                const code = fs.readFileSync(fullPath, 'utf-8');
                sourceFiles.push({ path: fullPath, code });
            }
        }
    }

    traverseDirectory(rootPath);
    const trimmedFiles = sourceFiles.slice(0, 5);
    console.log('First 5 source files:', trimmedFiles);
    return sourceFiles;
}