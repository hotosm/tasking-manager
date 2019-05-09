# Frontend

For one reason or another, you may be interested in exposing a feature only to certain users. This could be either role-based (e.g. project manager), level-based (beginner versus advanced), or expert mode-based. You can accomplish this both on the frontend and the backend!

On the frontend, these can be implemented in a variety of ways on `div`s, including `ng-if`, `ng-show`, and `ng-hide` for a given logic statement.

## Role-based

For administrators
```
profileCtrl.userDetails.role === 'ADMIN'
```

For project managers
```
profileCtrl.userDetails.role === 'PROJECT_MANAGER'
```

## Level-based
For advanced
```
profileCtrl.userDetails.mappingLevel === 'ADVANCED'
```

For intermediate
```
profileCtrl.userDetails.mappingLevel === 'INTERMEDIATE'
```

For beginner
```
profileCtrl.userDetails.mappingLevel === 'BEGINNER'
```

## Expert mode
```
projectCtrl.userDetails.isExpert
```

## Examples

Let's say you want to show something only for admins. You could do the following

```
<div ng-show="profileCtrl.userDetails.role === 'ADMIN'">
  Only admins should see this
</div>
```

Alternatively, if you want to hide something from new mappers, you could try

```
<div ng-hide="profileCtrl.userDetails.mappingLevel === 'BEGINNER'">
  This is for non-beginner mappers
</div>
```

# Backend

```
@tm.pm_only()
```