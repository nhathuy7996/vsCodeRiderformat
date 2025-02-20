import * as vscode from 'vscode';

function alignFields(document: vscode.TextDocument): vscode.TextEdit[] {
    const text = document.getText();
    const edits: vscode.TextEdit[] = [];
    
    // Tìm các fields để align
    const fieldsRegex = /private\s+(\w+)\s+(\w+)\s*(?:=\s*([^;]+))?\s*;/g;
    const fields: Array<{
        range: vscode.Range,
        modifier: string,
        type: string,
        name: string,
        value?: string
    }> = [];

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

function formatDocument(document: vscode.TextDocument): vscode.TextEdit[] {
    const text = document.getText();
    const edits: vscode.TextEdit[] = [];

    // ... existing field alignment code ...

    // Format spaces around operators
    const operatorRegex = /(\w+)\s*([\+\-\*\/\=\!\<\>\&\|]{1,2})\s*(\w+)/g;
    let operatorMatch;
    while ((operatorMatch = operatorRegex.exec(text))) {
        const startPos = document.positionAt(operatorMatch.index);
        const endPos = document.positionAt(operatorMatch.index + operatorMatch[0].length);
        const newText = `${operatorMatch[1]} ${operatorMatch[2]} ${operatorMatch[3]}`;
        edits.push(vscode.TextEdit.replace(new vscode.Range(startPos, endPos), newText));
    }

    // Format spaces after keywords
    const keywordRegex = /(if|for|while|switch|catch)\(/g;
    let keywordMatch;
    while ((keywordMatch = keywordRegex.exec(text))) {
        const startPos = document.positionAt(keywordMatch.index);
        const endPos = document.positionAt(keywordMatch.index + keywordMatch[0].length);
        const newText = keywordMatch[0].replace('(', ' (');
        edits.push(vscode.TextEdit.replace(new vscode.Range(startPos, endPos), newText));
    }

    // Format spaces in method declarations
    const methodDeclRegex = /(\w+)\s*\((.*?)\)\s*{/g;
    let methodDeclMatch;
    while ((methodDeclMatch = methodDeclRegex.exec(text))) {
        const startPos = document.positionAt(methodDeclMatch.index);
        const endPos = document.positionAt(methodDeclMatch.index + methodDeclMatch[0].length);
        const params = methodDeclMatch[2].split(',').map(p => p.trim()).join(', ');
        const newText = `${methodDeclMatch[1]}(${params})\n{`;
        edits.push(vscode.TextEdit.replace(new vscode.Range(startPos, endPos), newText));
    }

    // Format spaces in generic declarations
    const genericRegex = /(\w+)\s*<\s*(\w+)\s*>/g;
    let genericMatch;
    while ((genericMatch = genericRegex.exec(text))) {
        const startPos = document.positionAt(genericMatch.index);
        const endPos = document.positionAt(genericMatch.index + genericMatch[0].length);
        const newText = `${genericMatch[1]}<${genericMatch[2]}>`;
        edits.push(vscode.TextEdit.replace(new vscode.Range(startPos, endPos), newText));
    }

    // Format spaces in array declarations
    const arrayRegex = /new\s*\[\s*\]/g;
    let arrayMatch;
    while ((arrayMatch = arrayRegex.exec(text))) {
        const startPos = document.positionAt(arrayMatch.index);
        const endPos = document.positionAt(arrayMatch.index + arrayMatch[0].length);
        const newText = 'new[]';
        edits.push(vscode.TextEdit.replace(new vscode.Range(startPos, endPos), newText));
    }

    // Format spaces after commas
    const commaRegex = /,(\w)/g;
    let commaMatch;
    while ((commaMatch = commaRegex.exec(text))) {
        const startPos = document.positionAt(commaMatch.index);
        const endPos = document.positionAt(commaMatch.index + commaMatch[0].length);
        const newText = `, ${commaMatch[1]}`;
        edits.push(vscode.TextEdit.replace(new vscode.Range(startPos, endPos), newText));
    }

    return edits;
}

export function activate(context: vscode.ExtensionContext) {
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
        provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
            return formatDocument(document);
        }
    });

    // Đăng ký event khi save file
    let saveListener = vscode.workspace.onWillSaveTextDocument(event => {
        if (event.document.languageId === 'csharp') {
            const edits = formatDocument(event.document);
            if (edits.length > 0) {
                event.waitUntil(Promise.resolve(edits));
            }
        }
    });

    context.subscriptions.push(disposable, formatter, saveListener);
}

export function deactivate() {}