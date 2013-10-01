<%page args="languages" />
<ul class="nav pull-right">
  <li class="dropdown"><a href="#" data-toggle="dropdown" class="dropdown-toggle">${request.locale_name}<b class="caret"></b></a>
    <ul role="menu" class="dropdown-menu languages">
      % for language in languages:
      <li><a href>${language}</a></li>
      % endfor
    </ul>
  </li>
</ul>
