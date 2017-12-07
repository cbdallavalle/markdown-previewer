import {
  saveOfflineMarkdown,
  loadOfflineMarkdowns,
  getSingleMarkdown,
  setPendingMarkdownsToSynced
} from './indexedDB';

/****EVENT LISTENERS****/

// Update HTML preview when markdown textarea changes
$('#live-markdown').on('keyup', event => updatePreview(event));

// Set selected markdown when using drop down menu
$('#offline-markdowns').on('change', (event) => {
  let markdownId = $(this).val().split('-')[1];
  setSelectedMarkdown(markdownId);
});

// Save markdown to IndexedDB

const sendMessageToSync = markdown => {
  navigator.serviceWorker.controller.postMessage({ 
    type: 'add-markdown',
    markdown: markdown
  });
};

$('#submit-markdown').on('click', event => {
  let content = $('#live-markdown').val();
  let title = $('#title').val();
  let id = Date.now();

  saveOfflineMarkdown({ id, content, title, status: 'pendingSync' })
    .then(md => { 
      sendMessageToSync({ id, content, title, status: 'pendingSync' });
      appendMarkdowns([{ id, title, status: 'pendingSync' }]);
      $('#offline-markdowns').val(`md-${id}`);
    })
    .catch(error => console.log(`Error saving markdown: ${error}`));
});

navigator.serviceWorker.addEventListener('message', event => {
  if (event.data.type === 'markdowns-synced') {
    setPendingMarkdownsToSynced()
      .then(result => {
        $('#offline-markdowns option').each((idx, option) => {
          $(option).text($(option).text().replace('*',''))
        })
      })
      .catch(error => console.error(error))
  }
});


/****HELPER FUNCTIONS****/

// Append markdowns to the drop-down menu
const appendMarkdowns = (mds) => {
  mds.forEach(md => {
    if (md.status === 'pendingSync') {
      $('#offline-markdowns').append(`<option value="md-${md.id}">${md.title}*</option>`);
    } else {
      $('#offline-markdowns').append(`<option value="md-${md.id}">${md.title}</option>`);
    }
  });
}

// Update markdown/HTML content when selecting markdown from drop-down menu
const setSelectedMarkdown = (id) => {
  getSingleMarkdown(id).then(md => {
    $('#live-markdown').val(md.content);
    $('#live-markdown').keyup();
  }).catch(error => console.log({error}))
}

// Update the HTML preview when the markdown changes
const updatePreview = (event) => {
  const md = markdownit();
  let htmlResult = md.render(event.currentTarget.value);
  $('#html-preview').html(htmlResult);
};



/****SERVICE WORKER REGISTRATION****/

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    
    // Load markdowns from indexedDB
    loadOfflineMarkdowns()
      .then(markdowns => appendMarkdowns(markdowns))
      .catch(error => console.log(`Error loading markdowns: ${error}`));
    
    // Register a new service worker
    navigator.serviceWorker.register('./service-worker.js')
      .then(registration => navigator.serviceWorker.ready)
      .then(registration => {
        Notification.requestPermission();
        console.log('ServiceWorker registration successful');
      }).catch(err => {
        console.log(`ServiceWorker registration failed: ${err}`);
      });

  });
}
