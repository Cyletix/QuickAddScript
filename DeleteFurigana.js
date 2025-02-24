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
        return null;
    }
    const validExtensions = ["md", "canvas"];
    if (!validExtensions.includes(activeFile.extension)) {
        new Notice("The active file is not a Markdown or Canvas file.");
        return null;
    }
    const editor = app.workspace.activeEditor?.editor;
    if (!editor) {
        new Notice("No active editor found.");
        return null;
    }
    editor.focus();
    let selection = editor.getSelection();
    if (!selection || selection.trim() === "") {
        new Notice("No text is selected.");
        return null;
    }
    // 记录原始文本
    const originalText = selection;
    const startPos = editor.getCursor("from");
    let modifiedText = selection;
    for (const transformFunction of transformFunctions) {
        modifiedText = transformFunction(modifiedText);
    }
    editor.replaceSelection(modifiedText);
    // 计算新选区
    const lines = modifiedText.split("\n");
    let newEndPos;
    if (lines.length === 1) {
        newEndPos = { line: startPos.line, ch: startPos.ch + lines[0].length };
    } else {
        newEndPos = { line: startPos.line + lines.length - 1, ch: lines[lines.length - 1].length };
    }
    editor.setSelection(startPos, newEndPos);
    return { original: originalText, modified: modifiedText };
}

/**
 * DeleteFurigana：删除假名注释
 * 将形如 {汉字|假名} 的注释替换为仅保留汉字
 */
function deleteFurigana(content) {
    return content.replace(/\{([^|]+?)\|[^}]+?\}/g, '$1');
}

// QuickAdd Macro 入口：删除假名注释（保留选区）
module.exports = async (params) => {
    const result = await processSelectedText([deleteFurigana]);
    if (result) {
        if (result.original !== result.modified) {
            new Notice("Furigana annotations have been removed from the document.");
        } else {
            new Notice("No furigana annotations found.");
        }
    }
};
