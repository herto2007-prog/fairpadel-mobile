# Fairpadel Mobile App

App móvil de Fairpadel construida con React Native + Expo.

## 🚀 Cómo empezar

### 1. Instalar dependencias
```bash
cd mobile
npm install
```

### 2. Configurar variables de entorno
```bash
cp .env.example .env
# Editá .env con la URL de tu backend
```

### 3. Correr en desarrollo
```bash
# Android
npm run android

# iOS (requiere macOS)
npm run ios

# Web
npm run web
```

## 📁 Estructura

```
app/                    # Expo Router (pantallas)
  (tabs)/               # Navegación por tabs
  login.tsx
  register.tsx
src/
  services/             # API calls (reutilizado del web)
  features/auth/        # AuthContext
  components/ui/        # Componentes base
  utils/                # Utilidades (reutilizado del web)
  lib/                  # Helpers
```

## 📱 Cuentas necesarias para publicar

| Cuenta | Costo | Link |
|--------|-------|------|
| Apple Developer Program | USD 99/año | https://developer.apple.com |
| Google Play Console | USD 25 único | https://play.google.com/console |
| Expo (opcional) | Gratis | https://expo.dev |

## 🎨 Stack

- **Framework:** Expo ~56 + React Native 0.85
- **Navegación:** Expo Router
- **Estilos:** NativeWind (Tailwind para RN)
- **HTTP:** Axios
- **Forms:** React Hook Form + Zod
- **Icons:** Lucide React Native
- **Storage:** AsyncStorage
