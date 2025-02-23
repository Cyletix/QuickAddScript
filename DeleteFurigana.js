/**
 * 通用文本处理框架
 * ✅ 适用于 QuickAdd Macro
 * ✅ 可扩展多个文本转换函数
 * ✅ 替换文本后保持原有选中区域
 */
async function processSelectedText(transformFunctions) {
    const activeFile = app.workspace.getActiveFile();
    if (!activeFile) {
        new Notice("No file is currently open.");
        return;
    }
    const validExtensions = ["md", "canvas"];
    if (!validExtensions.includes(activeFile.extension)) {
        new Notice("The active file is not a Markdown or Canvas file.");
        return;
    }
    const editor = app.workspace.activeEditor?.editor;
    if (!editor) {
        new Notice("No active editor found.");
        return;
    }
    // 确保编辑器处于编辑模式，并获取最新选区
    editor.focus();
    let selection = editor.getSelection();
    if (!selection || selection.trim() === "") {
        new Notice("No text is selected.");
        return;
    }
    // 记录原始选区起始位置
    const startPos = editor.getCursor("from");
    // 依次执行所有传入的文本转换函数
    let modifiedText = selection;
    for (const transformFunction of transformFunctions) {
        modifiedText = transformFunction(modifiedText);
    }
    // 替换选中的文本
    editor.replaceSelection(modifiedText);
    // 计算新选区
    const lines = modifiedText.split("\n");
    let newEndPos;
    if (lines.length === 1) {
        newEndPos = { line: startPos.line, ch: startPos.ch + lines[0].length };
    } else {
        newEndPos = { line: startPos.line + lines.length - 1, ch: lines[lines.length - 1].length };
    }
    // 恢复选区
    editor.setSelection(startPos, newEndPos);
}

/**
 * DeleteFurigana：删除假名注释
 * 将形如 {汉字|假名} 的注释替换为仅保留汉字
 */
function deleteFurigana(content) {
    return content.replace(/\{([^|]+?)\|[^}]+?\}/g, '$1');
}

// QuickAdd Macro 入口：DeleteFurigana（保留选区）
module.exports = async (params) => {
    await processSelectedText([deleteFurigana]);
    new Notice("Furigana annotations have been removed from the document.");
};