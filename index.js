const Evernote = require('evernote');

const GitHub = require('github-api');

const enml = require('./enml');

const { Observable } = require('rxjs');

require('dotenv').config();

const EVERNOTE_TOKEN = process.env.EVERNOTE_TOKEN;

const GH_USER = process.env.GH_USER;
const GH_TOKEN = process.env.GH_TOKEN;

const gh = new GitHub({
  token: GH_TOKEN
});

const client = new Evernote.Client({ token: EVERNOTE_TOKEN, sandbox: false, china: false });

const note_store = client.getNoteStore();

note_store.listNotebooks().then(notebooks => {
  if (notebooks.length === 0) return Promise.resolve();
  // TODO: Each notebook
  const filter = { notebookGuid: notebooks[0].guid };
  const resultSpec = { includeTitle: true };
  return note_store.findNotesMetadata(filter, 0, 250, resultSpec)
    .then(({notes}) => {
      noteResultSpec = { includeContent: true, includeResourcesData: true };
      return Promise.all(
        notes.map(note => {
          return note_store.getNoteWithResultSpec(note.guid, noteResultSpec)
        })
      );
    })
    .then(notes => {
      let gist = gh.getGist();
      let gist_content = {
        public: false,
        description: notebooks[0].title,
        files: {}
      };

      let titles = [];

      notes.forEach(note => {
        let title = note.title;

        const duplicateCount = titles.filter((t) => t === title).length;

        if (duplicateCount > 0) {
          title = `${title}-${duplicateCount + 1}`;
        }
        titles.push(title);
        let resources = {};
        if (note.resources.length > 0) {
          notes.resources.forEach(resource => {
            const image = resource.data.body;
            const md5 = resource.data.bodyHash.toString();
            const mimeType = resource.mime;
            const base64Image = `data:${mimeType};base64,${image.toString('base64')}`;

            resources[md5] = base64Image;
          });
        }
        const markdown = enml.toMarkdown(note.content);

        if (title.indexOf('Mocha') >= 0) {
          console.log(markdown);
        }

        gist_content.files[`${title}.md`] = { content: markdown };
      });

      // return gist.create(gist_content);
      return Promise.resolve();
    })
    .catch(err => {
      return Promise.reject(err);
    });
})
.catch(err => {
  console.error(err);
});
