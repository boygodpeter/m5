"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
//最後搞這個東西的時間:6/4
//有一些字元沒辦法很好顯示，所以這邊要先替換一些掉
function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
//產生兩個按鈕兩個按鈕（csv、txt）
//接收 Extension Host 回傳檔案內容後顯示左右分割區
//為了能跟 Extension 通訊，我們用 window.acquireVsCodeApi() 取得 vscode 物件進行 postMessage
//我好想死 我好累 我編譯器還沒念完 
function getWebviewContent(escapedCode) {
    return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8" />
  <title>Code 轉換</title>
  <style>
    body {
      font-family: sans-serif;
      padding: 0;
      margin: 0;
    }
    .button-container {
      display: flex;
      height: 100vh;
    }
    .option-box {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 1.5em;
      font-weight: bold;
      color: white;
      user-select: none;
    }
    .option-box.csv {
      background-color:rgb(4, 151, 250);
    }
    .option-box.txt {
      background-color:rgb(11, 149, 117);
    }
    .split-container {
      display: none;
      height: 100vh;
    }
    .split {
      display: flex;
      height: 100%;
    }
    .pane {
      width: 50%;
      padding: 10px;
      overflow: auto;
      box-sizing: border-box;
    }
    .pane h3 {
      margin: 0 0 10px 0;
      border-bottom: 1px solid #ccc;
      padding-bottom: 5px;
    }
    pre {
      white-space: pre-wrap;
      word-wrap: break-word;
    }
  </style>
</head>
<body>
  <!-- 一開始顯示兩個按鈕 -->
  <div class="button-container" id="buttonContainer">
    <div class="option-box csv" id="csvBox">csv</div>
    <div class="option-box txt" id="txtBox">txt</div>
  </div>

  <!-- 按下其中一個之後，這個區塊才顯示 -->
  <div class="split-container" id="splitContainer">
    <div class="split">
      <div class="pane">
        <h3>source code:</h3>
        <pre id="sourceCode"></pre>
      </div>
      <div class="pane">
        <h3>pseudo code:</h3>
        <pre id="pseudoCode"></pre>
      </div>
    </div>
  </div>

  <script>
    // 取得對應的 vscode 物件，用來跟 Extension Host 通訊
    const vscode = acquireVsCodeApi();
    // Webview 裡保存原本的 selected code
    const code = \`${escapedCode}\`;

    // DOM 參考
    const btnContainer = document.getElementById('buttonContainer');
    const splitContainer = document.getElementById('splitContainer');
    const srcPre = document.getElementById('sourceCode');
    const pseudoPre = document.getElementById('pseudoCode');

    // 點擊 csv 按鈕時，傳訊息給 Extension 開始存檔
    document.getElementById('csvBox').addEventListener('click', () => {
      vscode.postMessage({ command: 'save', format: 'csv', code: code });
    });

    // 點擊 txt 按鈕時，傳訊息給 Extension 開始存檔
    document.getElementById('txtBox').addEventListener('click', () => {
      vscode.postMessage({ command: 'save', format: 'txt', code: code });
    });

    // 處理 Extension 回傳過來的訊息
    window.addEventListener('message', event => {
      const message = event.data;
      switch (message.command) {
        case 'showContent':
          // 收到要顯示的檔案內容之後，隱藏按鈕區，顯示分割畫面
          btnContainer.style.display = 'none';
          splitContainer.style.display = 'block';
          // 左邊顯示原本的 code
          srcPre.innerText = code;
          // 右邊顯示從檔案讀回來的內容
          pseudoPre.innerText = message.content;
          break;
      }
    });
  </script>
</body>
</html>`;
}
//activate() 會在這個 Extension 被啟動時呼叫
function activate(context) {
    const disposable = vscode.commands.registerCommand('m5_group_test.convertCommand', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('沒有開啟編輯器或沒有選取任何文字。');
            return;
        }
        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);
        if (!selectedText) {
            vscode.window.showErrorMessage('請先選取一些程式碼，再按右鍵「轉換」。');
            return;
        }
        // 建立一個 Webview Panel
        const panel = vscode.window.createWebviewPanel('convertView', 'Code 轉換', vscode.ViewColumn.Active, {
            enableScripts: true
        });
        const escaped = escapeHtml(selectedText);
        panel.webview.html = getWebviewContent(escaped);
        //  Webview 傳訊息給 Extension Host
        panel.webview.onDidReceiveMessage((message) => __awaiter(this, void 0, void 0, function* () {
            if (message.command === 'save') {
                // message.format 可能是 "csv" 或 "txt"
                // message.code 就是剛剛選取的原始程式碼
                const format = message.format;
                const codeToSave = message.code;
                //把csv或是txt檔案放在根目錄
                let folderUri;
                if (vscode.workspace.workspaceFolders &&
                    vscode.workspace.workspaceFolders.length > 0) {
                    folderUri = vscode.workspace.workspaceFolders[0].uri;
                }
                else {
                    // 沒有開啟 workspace 的情況，可以先顯示錯誤訊息
                    vscode.window.showErrorMessage('請先開啟一個 Workspace，才能儲存檔案。');
                    return;
                }
                // 未來當作是為進去模型的input，所以我這邊直接給他一個input名
                //BTW 我好想吃蛋糕
                const fileName = `input.${format}`;
                const fileUri = vscode.Uri.joinPath(folderUri, fileName);
                try {
                    yield vscode.workspace.fs.writeFile(fileUri, Buffer.from(codeToSave, 'utf8'));
                    // 讀取剛剛的input.txt或是input.csv
                    const fileData = yield vscode.workspace.fs.readFile(fileUri);
                    const fileContent = Buffer.from(fileData).toString('utf8');
                    // 把獨到的檔案回傳給Webview
                    panel.webview.postMessage({
                        command: 'showContent',
                        content: fileContent
                    });
                }
                catch (err) {
                    vscode.window.showErrorMessage(`儲存或讀取檔案失敗: ${err}`);
                }
            }
        }), undefined, context.subscriptions);
    });
    context.subscriptions.push(disposable);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map