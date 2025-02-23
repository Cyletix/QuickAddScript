/**
 * 通用文本处理框架
 * 适用于 QuickAdd Macro
 * 可扩展多个文本转换函数，替换选中文本后保持原有选区
 * 若处理成功则返回 true，否则返回 false
 */
async function processSelectedText(transformFunctions) {
    const activeFile = app.workspace.getActiveFile();
    if (!activeFile) {
        new Notice("No file is currently open.");
        return false;
    }
    const validExtensions = ["md", "canvas"];
    if (!validExtensions.includes(activeFile.extension)) {
        new Notice("The active file is not a Markdown or Canvas file.");
        return false;
    }
    const editor = app.workspace.activeEditor?.editor;
    if (!editor) {
        new Notice("No active editor found.");
        return false;
    }
    editor.focus();
    let selection = editor.getSelection();
    if (!selection || selection.trim() === "") {
        new Notice("No text is selected.");
        return false;
    }
    // 记录原始选区起始位置
    const startPos = editor.getCursor("from");
    let modifiedText = selection;
    for (const transformFunction of transformFunctions) {
        modifiedText = transformFunction(modifiedText);
    }
    editor.replaceSelection(modifiedText);
    const lines = modifiedText.split("\n");
    let newEndPos;
    if (lines.length === 1) {
        newEndPos = { line: startPos.line, ch: startPos.ch + lines[0].length };
    } else {
        newEndPos = { line: startPos.line + lines.length - 1, ch: lines[lines.length - 1].length };
    }
    editor.setSelection(startPos, newEndPos);
    return true;
}

/**
 * 递归遍历 DOM 节点，提取纯文本
 * 对于元素节点：
 *  - 如果是 <span> 标签，则不输出标签本身，只处理其子节点，保持当前缩进
 *  - 其它标签若有直接文本，则输出开始标签、子节点（缩进增加2个空格）及结束标签
 *  - 若无直接文本，则仅输出子节点内容（不增加缩进）
 * 对于文本节点：输出修剪后的文本（加上当前缩进和换行）
 */
function traverseDOM(node, indent) {
    let result = "";
    if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.trim();
        if (text) {
            result += indent + text + "\n";
        }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
        // 如果是 <span> 标签，则直接降级，不输出标签标记
        if (node.tagName.toLowerCase() === "span") {
            node.childNodes.forEach(child => {
                result += traverseDOM(child, indent);
            });
        } else {
            let hasDirectText = false;
            node.childNodes.forEach(child => {
                if (child.nodeType === Node.TEXT_NODE && child.textContent.trim() !== "") {
                    hasDirectText = true;
                }
            });
            let childrenResult = "";
            if (hasDirectText) {
                result += indent + `<${node.tagName.toLowerCase()}>` + "\n";
                node.childNodes.forEach(child => {
                    childrenResult += traverseDOM(child, indent + "  ");
                });
                result += childrenResult;
                result += indent + `</${node.tagName.toLowerCase()}>` + "\n";
            } else {
                node.childNodes.forEach(child => {
                    childrenResult += traverseDOM(child, indent);
                });
                result += childrenResult;
            }
        }
    }
    return result;
}

/**
 * stripHTMLtoText
 * 将选中的 HTML 片段转换为仅保留文本的层级结构，
 * 如果某层无直接文本，则该层降级，只输出子节点内容，
 * 并用换行和缩进展示不同标签之间的层级关系。
 */
function stripHTMLtoText(content) {
    // 为避免解析错误，将内容包装在一个容器内
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${content}</div>`, 'text/html');
    return traverseDOM(doc.body.firstElementChild, "");
}

// QuickAdd Macro 入口：DeleteHTMLtags & Format Lyrics
// 该脚本将选中的 HTML 内容转换为仅保留文本的树状层级结构，
// 如果某层没有直接文本，则降级处理，<span> 标签不保留标签标记
module.exports = async (params) => {
    const processed = await processSelectedText([stripHTMLtoText]);
    if (processed) {
        new Notice("HTML content has been formatted into a text tree structure.");
    }
};
