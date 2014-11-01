## Release Checklist

### Prerelease

- [ ] Notify translators of impending release
  (https://www.transifex.com/projects/p/osm-tasking-manager2/announcements/)
- [ ] pull latest translations

### Major Release

- [ ] create a branch
- [ ] Draft a new release https://github.com/hotosm/osm-tasking-manager2/releases/new
- [ ] Update CHANGELOG.md
- [ ] Update version number in setup.py
- [ ] git ci -m "Bumping version A.B.C"
- [ ] git tag A.B.C (for example 2.3.0)
- [ ] git push upstream --tags

TODO add document for Minor releases

### Deploy in production

TODO to be completed
