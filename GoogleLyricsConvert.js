/**
 * LyricsConvert
 * 提取Google搜索的歌词HTML中的歌词文本
 * - 在浏览器ctrl+shift+c 选中歌词部分，右键Copy，粘贴到Markdown文档中
 * - 使用此Quickadd Macro脚本提取歌词文本
 * - 使用 DOMParser 解析 HTML 格式的文件内容
 * - 提取所有 div[jsname="U8S5sf"] 内的 span[jsname="YS01Ge"] 文本作为歌词
 */
async function processFileContent(transformFunction) {
    const activeFile = app.workspace.getActiveFile();
    if (!activeFile) {
        new Notice("No file is currently open.");
        return;
    }
    if (activeFile.extension !== "md") {
        new Notice("The active file is not a Markdown file.");
        return;
    }
    const editor = app.workspace.activeEditor?.editor;
    let curPos = null;
    if (editor) {
        editor.focus();
        curPos = editor.getCursor();
    }
    const fileContent = await app.vault.read(activeFile);
    const modifiedContent = transformFunction(fileContent);
    await app.vault.modify(activeFile, modifiedContent);
    if (editor && curPos) {
        editor.setCursor(curPos);
    }
}

/**
 * 提取歌词
 */
function extractLyrics(content) {
    let frontmatter = "";
    let body = content;
    
    // 如果文件以 YAML frontmatter 开头，则提取 frontmatter
    if (content.startsWith('---')) {
        const endIndex = content.indexOf('---', 3);
        if (endIndex !== -1) {
            frontmatter = content.slice(0, endIndex + 3) + "\n";
            body = content.slice(endIndex + 3);
        }
    }
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(body, 'text/html');
    let lyrics = "";
    const divs = doc.querySelectorAll('div[jsname="U8S5sf"]');
    divs.forEach(div => {
        const spans = div.querySelectorAll('span[jsname="YS01Ge"]');
        spans.forEach(span => {
            lyrics += span.textContent + '\n';
        });
        lyrics += '\n'; // 添加段落之间的空行
    });
    
    return frontmatter + lyrics;
}

// QuickAdd Macro 入口：LyricsConvert（使用文件处理框架，保留光标位置）
module.exports = async (params) => {
    await processFileContent(extractLyrics);
    new Notice("Lyrics have been extracted and updated in the document.");
};
