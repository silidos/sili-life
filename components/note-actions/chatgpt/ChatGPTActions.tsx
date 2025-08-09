import React, { useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Button, IconButton, Tooltip, Portal, Dialog, TextInput, Snackbar } from 'react-native-paper';
import * as Clipboard from 'expo-clipboard';
import { useNotes } from '../../../store/notes';

function cleanMarkdown(
  s: string,
  opts?: { ensureFrontMatter?: boolean; defaultTitle?: string }
) {
  const ensureFM = opts?.ensureFrontMatter ?? true;
  const title = (opts?.defaultTitle || 'Untitled').replace(/\n/g, ' ').trim();

  // 1) Normalize line endings and trim trailing spaces
  let out = (s ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+$/gm, '');

  // 2) Collapse 3+ blank lines -> 2
  out = out.replace(/\n{3,}/g, '\n\n');

  // 3) Ensure a blank line after ATX headings (#, ##, ...)
  out = out.replace(/^(#{1,6} .+)([^\n]|$)/gm, (m, g1, g2) => `${g1}\n${/^\n/.test(g2) ? '' : '\n'}${g2 ?? ''}`);

  // 4) Normalize checklists and bullets
  out = out
    // convert "* [ ]" or "+ [ ]" to "- [ ]"
    .replace(/^[\*\+]\s+(\[[ xX]\])\s+/gm, '- $1 ')
    // normalize "[x]" casing/spaces
    .replace(/-\s+\[\s*([xX ])\s*\]\s*/gm, (m, mark) => `- [${mark === 'x' || mark === 'X' ? 'x' : ' '}] `);

  // 5) Normalize fenced code blocks: ensure triple backticks on their own lines
  out = out
    // ensure opening ``` is at line start
    .replace(/(\S)\n```/g, '$1\n\n```')
    // ensure closing ``` has a blank line after if followed by text
    .replace(/```\n(\S)/g, '```\n\n$1');

  // 6) Optionally inject minimal front-matter if missing
  const hasFrontMatter = /^---\n[\s\S]*?\n---\n?/m.test(out);
  if (ensureFM && !hasFrontMatter) {
    const created = new Date().toISOString().slice(0, 10);
    const fm = `---\ntype: chatgpt\ntitle: ${title}\ntags: []\ncreated: ${created}\nversion: cgpt-note-v1\n---\n\n`;
    out = fm + out.trimStart();
  }

  return out.trimEnd();
}


async function readClipboard(): Promise<string> {
  try {
    const s = await Clipboard.getStringAsync();
    return s || '';
  } catch {
    return '';
  }
}

export default function ChatGPTActions({ noteId }: { noteId: string }) {
  const note = useNotes(s => s.getNote(noteId));
  const updateNote = useNotes(s => s.updateNote);

  const [dialogVisible, setDialogVisible] = useState(false);
  const [buffer, setBuffer] = useState('');
  const [snack, setSnack] = useState<{ visible: boolean; text: string }>({ visible: false, text: '' });

  const openPasteDialog = async () => {
    setDialogVisible(true);
    // Try to prefill with clipboard contents (non-blocking)
    const clip = await readClipboard();
    if (clip && !buffer) setBuffer(clip);
  };
  const confirmPaste = () => {
    const cleaned = cleanMarkdown(buffer || '', { defaultTitle: note?.title || 'ChatGPT Note' });
    if (!cleaned.trim()) {
      setSnack({ visible: true, text: 'Nothing to insert — paste some text first.' });
      return;
    }
    try {
      updateNote(noteId, { content: cleaned });
      setDialogVisible(false);
      setBuffer('');
    } catch (e) {
      console.warn('Failed to update note', e);
      setSnack({ visible: true, text: 'Failed to insert. Try again.' });
    }
  };


  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Tooltip title="Paste exported Markdown from ChatGPT">
        <IconButton
          icon="clipboard-outline"
          onPress={openPasteDialog}
          accessibilityLabel="Paste Export"
          size={20}
          style={{ margin: 0, marginRight: 30 }}
        />
      </Tooltip>
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>Paste exported Markdown</Dialog.Title>
          <Dialog.ScrollArea>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 12 }}
                style={{ maxHeight: 420 }}
              >
                <TextInput
                  mode="outlined"
                  placeholder="Paste here…"
                  multiline
                  value={buffer}
                  onChangeText={setBuffer}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textAlignVertical="top"
                  style={{ minHeight: 180 }}
                />
              </ScrollView>
            </KeyboardAvoidingView>
          </Dialog.ScrollArea>
          <Dialog.Actions style={{ justifyContent: 'space-between' }}>
            <Button onPress={async () => setBuffer(await readClipboard())}>Paste from clipboard</Button>
            <View style={{ flexDirection: 'row' }}>
              <Button onPress={() => { setDialogVisible(false); setBuffer(''); }}>Cancel</Button>
              <Button onPress={confirmPaste}>Insert</Button>
            </View>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    <Snackbar
      visible={snack.visible}
      onDismiss={() => setSnack({ visible: false, text: '' })}
      duration={1800}
    >
      {snack.text}
    </Snackbar>
    </View>
  );
}