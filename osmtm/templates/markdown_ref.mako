<div class="row">
  <div class="col-md-12">
     <ul class="nav nav-pills">
       <li><a href="#text" id="text_tab" data-toggle="tab">${_('Text')}</a></li>
       <li><a href="#lists" id="list_tab" data-toggle="tab">${_('Lists')}</a></li>
       <li><a href="#embeds" id="embed_tab" data-toggle="tab">${_('Embeds')}</a></li>
     </ul>
  </div>
</div>
<div class="tab-content">
  <div id="text" class="row-fluid tab-pane">
    <div class="row">
      <div class="col-md-6">
        <pre>${_('Heading')} ${_('or')} # ${_('Heading')}
=======

${_('Subheading')} or ## ${_('Subheading')}
----------

${_('Only')} ### ${_('Subsubheading')}</pre>
      </div>
      <div class="col-md-6">
        <h1>${_('Heading')}</h1>
        <h2>${_('Subheading')}</h2>
        <h3>${_('Subsubheading')}</h3>
      </div>
    </div>
    <div class="row">
      <div class="col-md-6">
        <pre>${_('Text attributes')} *${_('italic')}*,
**${_('bold')}**, ${_('and')} `${_('monospace')}`.</pre>
      </div>
      <div class="col-md-6">
        <p>${_('Text attributes')} <i>${_('italic')}</i>, <strong>${_('bold')}</strong>, <code>${_('monospace')}</code>.</p>
      </div>
    </div>
    <div class="row">
      <div class="col-md-6">
        <pre>${_('The rain---not the reign---in Spain.')}</pre>
      </div>
      <div class="col-md-6">
        <p>${_('The rain&ndash;not the reign&ndash;in Spain.')|n}</p>
      </div>
    </div>
    <div class="row">
      <div class="col-md-6">
        <pre>${_('Paragraphs are separated<br />by a blank line.')|n}

${_('Paragraphs are separated<br />by a blank line.')|n}</pre>
      </div>
      <div class="col-md-6">
        <p>${_('Paragraphs are separated by a blank line.')}</p>
        <p>${_('Paragraphs are separated by a blank line.')}</p>
      </div> 
    </div>
    <div class="row">
      <div class="col-md-6">
        <pre>    ${_('A block (four spaces).')}</pre>
      </div>
      <div class="col-md-6">
        <p>&nbsp;&nbsp;&nbsp;&nbsp;${_('A block (four spaces)')}</p>
      </div>
    </div>
  </div>
  <div id="lists" class="row-fluid tab-pane">
    <div class="row">
      <div class="col-md-6">
        <pre>${_('Mapping list:')}

* ${_('roads')}
* ${_('landuses')}
* ${_('buildings')}</pre>
      </div>
      <div class="col-md-6">
        <p>${_('Mapping list:')}</p>
        <ul>
          <li>${_('roads')}</li>
          <li>${_('landuses')}</li>
          <li>${_('buildings')}</li>
        </ul>
      </div>
    </div>
    <div class="row">
      <div class="col-md-6">
        <pre>${_('Mapping order:')}

1. ${_('roads')}
2. ${_('landuses')}
3. ${_('buildings')}</pre>
      </div>
      <div class="col-md-6">
        <p>${_('Mapping order:')}</p>
        <ol>
          <li>${_('roads')}</li>
          <li>${_('landuses')}</li>
          <li>${_('buildings')}</li>
        </ol>
      </div>
    </div>
  </div>
  <div id="embeds" class="row-fluid tab-pane">
    <div class="row">
      <div class="col-md-6">
        <pre>[${_('A link')}](http://example.com).</pre>
      </div>
      <div class="col-md-6">
        <p><a rel="nofollow" class="external text" href="http://example.com">${_('A link')}</a>.</p>
      </div>
    </div>
    <div class="row">
      <div class="col-md-6">
        <pre>![${_('alternate text')}](http://hotosm.org/logo.png)</pre>
      </div>
      <div class="col-md-6">
        <img src="${request.static_url('osmtm:static/img/hot.png')}" alt=${_('alternate text')}>
      </div>
    </div>
    <div class="row">
      <div class="col-md-6">
        <pre>![${_('video')}](https://www.youtube.com/watch?v=suk8uRpIBQw)
![${_('video')}](https://vimeo.com/13211783)</pre>
      </div>
      <div class="col-md-6">
        <p>${_('Currently supports Youtube, Vimeo, and Flickr embeds.')}</p>
      </div>
    </div>
  </div>
</div>
