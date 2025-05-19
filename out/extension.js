"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
// src/extension.ts
const vscode = __importStar(require("vscode"));
function activate(context) {
    // 1. 建立 StatusBarItem，靠右對齊 (Alignment.Right)，priority 設 100
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    // 2. 設定顯示文字、提示文字與點擊後要觸發的指令
    statusBarItem.text = '$(rocket) 點我！'; // $(rocket) = Codicon
    statusBarItem.tooltip = '這是你的第一個 Status Bar 外掛';
    statusBarItem.command = 'statusbar-demo.showMessage';
    // 3. 讓它顯示
    statusBarItem.show();
    // 4. 註冊點擊時要執行的指令
    const disposable = vscode.commands.registerCommand('statusbar-demo.showMessage', () => {
        vscode.window.showInformationMessage('🎉 你點了狀態列的項目！');
    });
    // 5. 把所有資源丟進 context.subscriptions，停用時 VS Code 會自動清理
    context.subscriptions.push(statusBarItem, disposable);
}
function deactivate() {
    // 通常不用寫任何東西，VS Code 會自動 dispose
}
//# sourceMappingURL=extension.js.map