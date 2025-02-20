"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
function alignFields(document) {
    const text = document.getText();
    const edits = [];
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
        return edits;
    }
    // Tính toán độ rộng cần thiết cho mỗi cột
    const maxTypeWidth = Math.max(...fields.map(f => f.type.length));
    const maxNameWidth = Math.max(...fields.map(f => f.name.length));
    // Tạo TextEdits cho mỗi field
    fields.forEach(field => {
        const paddedType = field.type.padEnd(maxTypeWidth);
        const paddedName = field.name.padEnd(maxNameWidth);
        const value = field.value ? ` = ${field.value}` : '';
        const newText = `private ${paddedType} ${paddedName}${value};`;
        edits.push(vscode.TextEdit.replace(field.range, newText));
    });
    return edits;
}
function activate(context) {
    // Đăng ký command thủ công
    let disposable = vscode.commands.registerCommand('rider-align.alignFields', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('No active editor!');
            return;
        }
        const edits = alignFields(editor.document);
        if (edits.length > 0) {
            editor.edit(builder => {
                edits.forEach(edit => builder.replace(edit.range, edit.newText));
            });
        }
    });
    // Đăng ký formatter cho file .cs
    let formatter = vscode.languages.registerDocumentFormattingEditProvider('csharp', {
        provideDocumentFormattingEdits(document) {
            return alignFields(document);
        }
    });
    // Đăng ký event khi save file
    let saveListener = vscode.workspace.onWillSaveTextDocument(event => {
        if (event.document.languageId === 'csharp') {
            const edits = alignFields(event.document);
            if (edits.length > 0) {
                event.waitUntil(Promise.resolve(edits));
            }
        }
    });
    context.subscriptions.push(disposable, formatter, saveListener);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map