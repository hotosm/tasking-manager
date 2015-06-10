<%page args="languages, languages_full" />
<li class="dropdown"><a href="#" data-toggle="dropdown" class="dropdown-toggle">${unicode(languages_full[languages.index(request.locale_name)], 'utf-8')}<b class="caret"></b></a>
  <ul role="menu" class="dropdown-menu languages">
    % for idx, language in enumerate(languages_full):
    <li><a href='${languages[idx]}'>${unicode(language, 'utf-8')}</a></li>
    % endfor
  </ul>
</li>
