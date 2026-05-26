# 1. Plan de Pruebas Unitarias: Organisation Service

El archivo `test_organisation_service.py` concentra las pruebas unitarias orientadas a validar el comportamiento del servicio principal de organizaciones (`OrganisationService`). El propósito fundamental de esta suite es garantizar que la consulta y recuperación de datos de las entidades funcionen de manera predecible, al mismo tiempo que se respetan estrictamente las reglas de acceso y autorización definidas en la arquitectura del sistema.

## 1.1. Relación con la lógica de negocio

Dentro de la lógica de negocio, estas pruebas aseguran la correcta segregación de roles al momento de listar información.

> [!IMPORTANT]
> El sistema debe distinguir con precisión entre usuarios regulares que administran proyectos locales y administradores globales de la plataforma.

La lógica validada dictamina que un usuario regular únicamente puede visualizar las organizaciones en las que ha sido designado explícitamente como administrador (*manager*). Por el contrario, un perfil con rol de administrador del sistema (`UserRole.ADMIN`) debe gozar de visibilidad global, obteniendo acceso a todas las organizaciones registradas, sin importar si existe una asignación directa.

A través de estos tests, el proyecto mitiga riesgos funcionales críticos. El principal riesgo prevenido es la escalada de privilegios y la exposición de datos, evitando que un usuario estándar acceda a información de organizaciones fuera de su jurisdicción. Adicionalmente, la suite previene caídas del sistema o respuestas no controladas (como errores HTTP 500) al garantizar que las consultas sobre recursos inexistentes sean manejadas correctamente a través de excepciones formales (`NotFound`).

## 1.2. Técnica de implementación

Como observación técnica para la ejecución y mantenimiento de estos tests, destaca la dependencia de *canned factories* (como `create_canned_organisation` y `create_canned_user`). Estas herramientas permiten inyectar estados predecibles en la base de datos en memoria, aislando cada prueba para evitar falsos positivos. Asimismo, se hace uso intensivo de *mocks* para interceptar llamadas internas, asegurando que la transformación de modelos de base de datos a objetos de transferencia (DTOs) ocurra en la capa adecuada.

### Ejemplo técnico

```python
    @pytest.fixture(autouse=True)
    async def setup_test_data(self, db_connection_fixture, request):
        assert db_connection_fixture is not None, "Database connection is not available"

        request.cls.test_org = await create_canned_organisation(db_connection_fixture)
        request.cls.test_user = await create_canned_user(db_connection_fixture)
        request.cls.db = db_connection_fixture

        assert self.test_org is not None, "Failed to create test organisation"
        assert self.test_user is not None, "Failed to create test user"
```

## 1.3. Casos de Prueba Implementados

La siguiente tabla mapea el comportamiento esperado y obtenido para cada escenario validado en el servicio de organizaciones.

| ID del Caso | Módulo | Objetivo | Precondiciones | Entrada | Resultado Esperado | Resultado Obtenido | Estado | Riesgo Asociado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-ORG-001** | OrganisationService | Validar la correcta recuperación de una organización mediante un ID válido. | Debe existir al menos una organización creada en la base de datos de pruebas. | ID numérico de la organización existente. | El servicio devuelve la entidad exacta que coincide con el identificador. | Retorna el objeto de la organización correcta. | Aprobado | Inconsistencia de datos al cruzar información entre entidades diferentes. |

## 1.4. Cobertura validada

### Captura de cobertura

## 1.5. Riesgos no cubiertos
