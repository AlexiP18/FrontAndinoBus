# 🧪 Guía de Pruebas: Conexión Frontend-Backend

## ✅ Estado Actual
- **Frontend:** Configurado y listo en `http://localhost:3000`
- **Backend:** Usando datos mock (stub) en `http://localhost:8080`
- **Base de datos:** PostgreSQL configurada pero el backend aún no la usa

---

## 🚀 Pasos para Probar la Conexión

### 1. Iniciar el Backend (Terminal 1)
```powershell
cd "c:\Users\alexi\Desktop\Proyecto DAS\backend-smartcode"
.\mvnw.cmd spring-boot:run
```
**Espera ver:** `Started BackendSmartcodeApplication`

### 2. Iniciar el Frontend (Terminal 2)
```powershell
cd "c:\Users\alexi\Desktop\Proyecto DAS\FrontAndinaBus"
npm run dev
```
**Espera ver:** `Ready on http://localhost:3000`

---

## 🧪 Casos de Prueba

### ✅ PRUEBA 1: Registro de Usuario
1. Abre: `http://localhost:3000/register`
2. Completa el formulario:
   - Nombre: `Juan`
   - Apellido: `Pérez`
   - Cédula: `1234567890`
   - Email: `juan@example.com`
   - Password: `Password123!`
   - Confirmar Password: `Password123!`
3. Click en "Registrarse"

**Resultado Esperado:**
- ✅ Redirige a `/dashboard/Cliente`
- ✅ Token guardado en localStorage
- ✅ Datos del usuario guardados

**Verificar en DevTools (F12):**
- Pestaña **Network:** Request a `/auth/register` con status `201`
- Pestaña **Application > Local Storage:** `token` y `user` presentes
- Pestaña **Console:** Sin errores

---

### ✅ PRUEBA 2: Login como Cliente
1. Abre: `http://localhost:3000/login`
2. Ingresa:
   - Email: `cliente@example.com`
   - Password: `cualquiercosa`
3. Click en "Iniciar sesión"

**Resultado Esperado:**
- ✅ Redirige a `/dashboard/Cliente`
- ✅ Token: `demo-token-client`
- ✅ Rol: `CLIENTE`

---

### ✅ PRUEBA 3: Login como Admin
1. Abre: `http://localhost:3000/login`
2. Ingresa:
   - Email: `admin@andinobus.com` (debe contener "admin")
   - Password: `cualquiercosa`
3. Click en "Iniciar sesión"

**Resultado Esperado:**
- ✅ Redirige a `/dashboard/Cooperativa` o similar
- ✅ Token: `demo-token-admin`
- ✅ Rol: `ADMIN`

---

### ✅ PRUEBA 4: Verificar Usuario Autenticado
1. Después de hacer login
2. Abre DevTools > Console
3. Ejecuta:
```javascript
// Ver token
console.log(localStorage.getItem('token'));

// Ver datos del usuario
console.log(JSON.parse(localStorage.getItem('user')));
```

**Resultado Esperado:**
```javascript
// Token
"demo-token-client" // o "demo-token-admin"

// Usuario
{
  id: 2,
  email: "cliente@example.com",
  nombre: "Usuario",
  apellido: "Demo",
  role: "CLIENTE"
}
```

---

## 🔍 Verificar Comunicación

### En el Navegador (F12)

**Pestaña Network:**
1. Busca: `auth/login` o `auth/register`
2. Verifica:
   - **Status:** `200` (login) o `201` (register)
   - **Request URL:** `http://localhost:8080/auth/...`
   - **Request Headers:** `Content-Type: application/json`
   - **Response:** JSON con `token`, `userId`, `email`, `rol`, etc.

**Pestaña Console:**
- ❌ **NO** debe haber errores de CORS
- ❌ **NO** debe haber "Failed to fetch"
- ✅ Solo logs informativos

**Pestaña Application:**
- Local Storage debe contener:
  - `token`: String con el token JWT
  - `user`: JSON con datos del usuario

---

## 🐛 Solución de Problemas

### Error: "Failed to fetch" o "Network Error"
**Causa:** Backend no está corriendo o puerto incorrecto

**Solución:**
```powershell
# Verifica que el backend esté corriendo
cd "c:\Users\alexi\Desktop\Proyecto DAS\backend-smartcode"
.\mvnw.cmd spring-boot:run
```

---

### Error de CORS
**Síntoma:** Error en consola: "Access-Control-Allow-Origin"

**Solución:** El backend ya tiene CORS configurado para `localhost:3000`. Si cambias el puerto del frontend, avísame para actualizar el backend.

---

### No redirige después del login
**Causa:** Rol no reconocido o error en DASHBOARD_ROUTES

**Solución:**
1. Abre DevTools > Console
2. Busca el error
3. Verifica que `response.rol` sea: `CLIENTE`, `ADMIN`, `COOPERATIVA`, u `OFICINISTA`

---

### El dashboard está vacío
**Síntoma:** Redirige pero no muestra contenido

**Solución:** Esto es normal, el dashboard aún necesita componentes. La autenticación funciona.

---

## 📊 Flujo de Datos Actual

```
┌─────────────────────────────────────────────────────┐
│ 1. Usuario completa formulario de login/register   │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 2. Frontend envía POST a /auth/login o /register   │
│    Body: { email, password, nombres?, apellidos? }  │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 3. Backend (AuthController) recibe la petición     │
│    - Valida formato del email y password            │
│    - Genera token demo según el email               │
│    - Si email contiene "admin" → ADMIN              │
│    - Si no → CLIENTE                                │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 4. Backend responde con JSON                        │
│    {                                                 │
│      token: "demo-token-client",                    │
│      userId: 2,                                      │
│      email: "user@example.com",                     │
│      rol: "CLIENTE",                                │
│      nombres: "Usuario",                            │
│      apellidos: "Demo"                              │
│    }                                                 │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 5. Frontend recibe respuesta                        │
│    - Guarda token en localStorage                   │
│    - Guarda datos de usuario en localStorage        │
│    - Redirige según rol:                            │
│      * CLIENTE → /dashboard/Cliente                 │
│      * ADMIN → /dashboard/Cooperativa               │
│      * OFICINISTA → /dashboard/Oficinista           │
└─────────────────────────────────────────────────────┘
```

---

## ⚠️ IMPORTANTE: Estado Actual del Backend

**El backend actualmente usa datos MOCK (no reales):**

- ✅ **Funciona:** La comunicación HTTP entre frontend y backend
- ✅ **Funciona:** Validación de formularios
- ✅ **Funciona:** Manejo de tokens
- ❌ **NO funciona:** Guardado real en base de datos
- ❌ **NO funciona:** Validación de contraseñas
- ❌ **NO funciona:** Verificación de email duplicado

### ¿Qué necesita el Backend para usar la BD?

El backend necesita implementar:

1. **Entidad JPA para Usuario:**
   ```java
   @Entity
   @Table(name = "app_user")
   public class AppUser {
       @Id @GeneratedValue
       private Long id;
       private String email;
       private String passwordHash;
       private String nombres;
       private String apellidos;
       private String rol;
       // ... getters y setters
   }
   ```

2. **Repositorio JPA:**
   ```java
   public interface UserRepository extends JpaRepository<AppUser, Long> {
       Optional<AppUser> findByEmail(String email);
   }
   ```

3. **Servicio de Autenticación:**
   ```java
   @Service
   public class AuthService {
       // Lógica de login/register con BD
       // Hasheo de contraseñas con BCrypt
       // Generación de JWT tokens reales
   }
   ```

4. **Actualizar AuthController:**
   ```java
   @RestController
   public class AuthController {
       @Autowired
       private AuthService authService;
       
       @PostMapping("/auth/login")
       public AuthResponse login(...) {
           return authService.login(...);
       }
   }
   ```

5. **Activar perfil 'dev':**
   ```powershell
   .\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=dev
   ```

---

## ✅ Checklist de Verificación

- [ ] Backend corriendo en puerto 8080
- [ ] Frontend corriendo en puerto 3000
- [ ] Puedo abrir `http://localhost:3000/login`
- [ ] Puedo abrir `http://localhost:3000/register`
- [ ] El formulario de registro funciona
- [ ] El formulario de login funciona
- [ ] Después del login me redirige al dashboard
- [ ] En DevTools veo el token guardado
- [ ] En DevTools veo los datos del usuario
- [ ] En Network veo las peticiones HTTP con status 200/201
- [ ] No hay errores en la consola

---

## 🎯 Próximos Pasos Recomendados

1. ✅ **Verificar que la conexión funciona** (Pruebas 1-4)
2. ⚠️ **Notificar cambios necesarios en el backend** (ver sección arriba)
3. 🔧 **Implementar persistencia real en backend**
4. 🔐 **Agregar seguridad real (JWT + BCrypt)**
5. 🎨 **Completar dashboards con datos reales**

---

**¿Funciona todo?** ¡Perfecto! Ya tienes la conexión básica.

**¿Hay errores?** Usa la sección "Solución de Problemas" o consulta los logs del backend.
