chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'mark-highlight') return;

  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (!tab?.id) return;

  const isSupported = 
    tab.url?.includes('youtube.com') || 
    tab.url?.includes('twitch.tv');

  if (!isSupported) {
    console.warn('[Live Assist] Not on a supported platform');
    return;
  }

  try {
    await chrome.tabs.sendMessage(tab.id, { 
      type: 'MARK_HIGHLIGHT' 
    });
  } catch (error) {
    console.error('[Live Assist] Failed to send message:', error);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CHAT_SPIKE_DETECTED') {
    handleChatSpike(message.payload, sender.tab?.id);
  } else if (message.type === 'UPDATE_OVERLAY') {
    updateOverlayState(message.payload);
  } else if (message.type === 'EXPORT_HIGHLIGHTS') {
    handleExport(message.payload);
    sendResponse({ success: true });
  }
  
  return true;
});

async function handleChatSpike(payload: any, tabId?: number) {
  console.log('[Live Assist] Chat spike detected:', payload);
  
  if (tabId) {
    try {
      await chrome.tabs.sendMessage(tabId, {
        type: 'CHAT_SPIKE_DETECTED',
        payload,
      });
    } catch (error) {
      console.error('[Live Assist] Failed to notify tab:', error);
    }
  }
}

async function updateOverlayState(state: any) {
  await chrome.storage.local.set({ overlayState: state });
}

function handleExport(events: any[]) {
  const dataStr = JSON.stringify(events, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `live-assist-highlights-${timestamp}.json`;
  
  chrome.downloads.download({
    url,
    filename,
    saveAs: true,
  });
}

chrome.runtime.onInstalled.addListener(async () => {
  console.log('[Live Assist] Extension installed');
  
  await chrome.storage.local.set({
    settings: {
      chatSpikeEnabled: true,
      chatSpikeThreshold: 3.0,
      mergeWindowSeconds: 15,
      overlayEnabled: true,
    },
    overlayState: {
      isActive: false,
      highlightCount: 0,
      latestTimestamp: null,
      position: { x: 20, y: 20 },
    },
  });
});
