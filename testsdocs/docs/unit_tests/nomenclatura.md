# 1. Nomenclatura de Casos de Prueba

Todos los casos de prueba deben seguir una nomenclatura homogénea para garantizar trazabilidad, clasificación y fácil identificación dentro de la documentación y ejecución automatizada.

La estructura definida es la siguiente:

```text
TC-<MÓDULO>-<NÚMERO>
```

## Estructura

| Segmento | Descripción | Ejemplo |
| :--- | :--- | :--- |
| `TC` | Identificador de "Test Case". | `TC` |
| `<MÓDULO>` | Código corto representativo del módulo o servicio analizado. | `ORG`, `USR`, `PRJ` |
| `<NÚMERO>` | Secuencia incremental de tres dígitos. | `001`, `002`, `003` |


## Ejemplos

| Código | Interpretación |
| :--- | :--- |
| `TC-ORG-001` | Primer caso de prueba del módulo OrganisationService. |
| `TC-USR-003` | Tercer caso de prueba relacionado al módulo UserService. |
| `TC-PRJ-010` | Décimo caso de prueba asociado a ProjectService. |

