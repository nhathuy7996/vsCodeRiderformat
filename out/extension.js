"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
function activate(context) {
    let disposable = vscode.commands.registerCommand('rider-align.alignFields', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('No active editor!');
            return;
        }
        const document = editor.document;
        const text = document.getText();
        // Tìm các fields để align
        const fieldsRegex = /private\s+(\w+)\s+(\w+)\s*(?:=\s*([^;]+))?\s*;/g;
        const fields = [];
        let match;
        while ((match = fieldsRegex.exec(text))) {
            const startPos = document.positionAt(match.index);
            const endPos = document.positionAt(match.index + match[0].length);
            fields.push({
                range: new vscode.Range(startPos, endPos),
                modifier: 'private',
                type: match[1],
                name: match[2],
                value: match[3]
            });
        }
        if (fields.length === 0) {
            vscode.window.showInformationMessage('No fields found to align!');
            return;
        }
        // Tính toán độ rộng cần thiết cho mỗi cột
        const maxTypeWidth = Math.max(...fields.map(f => f.type.length));
        const maxNameWidth = Math.max(...fields.map(f => f.name.length));
        // Format và thay thế text
        editor.edit(builder => {
            fields.forEach(field => {
                const paddedType = field.type.padEnd(maxTypeWidth);
                const paddedName = field.name.padEnd(maxNameWidth);
                const value = field.value ? ` = ${field.value}` : '';
                const newText = `private ${paddedType} ${paddedName}${value};`;
                builder.replace(field.range, newText);
            });
        });
    });
    context.subscriptions.push(disposable);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map