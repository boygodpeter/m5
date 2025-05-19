import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/** 產生 yyyyMMdd_HHmmss */
function timestamp() {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

export function activate(context: vscode.ExtensionContext) {
    /*── 狀態列按鈕 ───────────────────*/
    const bar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    bar.text = '$(save) 轉換';
    bar.command = 'm5-group-test.convert';          // ← 依你的 package.json 而定
    bar.tooltip = '將選取程式碼存檔並以 Markdown 預覽';
    bar.hide();
    context.subscriptions.push(bar);

    /*── 支援語言 ─────────────────────*/
    const supported = ['python', 'cpp', 'c', 'java'];

    /*── 監聽選取變化決定是否顯示 ─────*/
    context.subscriptions.push(
        vscode.window.onDidChangeTextEditorSelection(e => {
            const langOK = supported.includes(e.textEditor?.document.languageId ?? '');
            const selOK  = !e.selections[0].isEmpty;
            (langOK && selOK) ? bar.show() : bar.hide();
        })
    );

    /*── 指令主體 ─────────────────────*/
    context.subscriptions.push(
        vscode.commands.registerCommand('m5-group-test.convert', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) { return; }

            const code = editor.document.getText(editor.selection).trim();
            if (!code) {
                vscode.window.showWarningMessage('請先劃選程式碼。');
                return;
            }

            /* 1️⃣ 副檔名 QuickPick */
            const ext = await vscode.window.showQuickPick(['csv', 'txt'], {
                placeHolder: '選擇輸出格式'
            });
            if (!ext) { return; }

            /* 2️⃣ 選資料夾 */
            const dirUri = await vscode.window.showOpenDialog({
                canSelectFolders: true,
                canSelectFiles: false,
                openLabel: '選擇儲存資料夾'
            });
            if (!dirUri || dirUri.length === 0) { return; }

            /* 3️⃣ 寫檔 */
            const fileName = `code_${timestamp()}.${ext}`;
            const filePath = path.join(dirUri[0].fsPath, fileName);
            try {
                if (ext === 'csv') {
                    const csvLines = code.split('\n').map(l => `"${l.replace(/"/g, '""')}"`).join('\n');
                    fs.writeFileSync(filePath, csvLines, 'utf8');
                } else {
                    fs.writeFileSync(filePath, code, 'utf8');
                }
            } catch (err) {
                vscode.window.showErrorMessage(`寫檔失敗：${err}`);
                return;
            }

            /* 4️⃣ 開 Markdown 預覽 */
            const langId = editor.document.languageId;   // 依目前語言決定 code block 標籤
            const markdownDoc = await vscode.workspace.openTextDocument({
                content: `\`\`\`${langId}\n${code}\n\`\`\``,
                language: 'markdown'
            });

            await vscode.commands.executeCommand('markdown.showPreviewToSide', markdownDoc.uri);
            await vscode.window.showTextDocument(editor.document, editor.viewColumn ?? vscode.ViewColumn.One, false);

            vscode.window.showInformationMessage(`已輸出 ${fileName}，並於右側顯示 Markdown 預覽！`);
        })
    );
}

export function deactivate() { }
