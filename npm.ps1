# Wrapper de npm usando Docker para entornos sin Node.js local en Windows
param(
    [Parameter(ValueFromRemainingArguments=$true)]
    $RemainingArgs
)

# Detectar puerto a exponer si es 'run dev'
$ports = @()
if ($RemainingArgs -contains "dev") {
    $ports = @("-p", "5172:5172")
}

# Ejecutar npm en un contenedor node temporal
docker run --rm -it -v "${PWD}:/app" -w /app $ports node:20-alpine npm $RemainingArgs
