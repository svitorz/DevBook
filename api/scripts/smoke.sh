#!/usr/bin/env bash
# Script de fumaça do DevBook: exercita todos os endpoints contra uma API rodando.
#
#   ./scripts/smoke.sh                 # usa http://localhost:5000
#   BASE_URL=http://host:porta ./scripts/smoke.sh
#
# Cada linha compara o resultado obtido com o ESPERADO. O esperado é o contrato-alvo
# (status HTTP padronizados da fase 2); itens marcados com [contrato] dependem de
# decisões registradas no PROGRESS.md. Sai com código 1 se algum item falhar.
# Requer: bash, curl, jq.

set -u

BASE_URL="${BASE_URL:-http://localhost:5000}"
RUN="$(date +%s%N | tail -c 9)"
SENHA="Senha@123"
NOVA_SENHA="Nova@4567"

PASS=0
FAIL=0
STATUS=""
BODY=""

# req METODO CAMINHO [CORPO] [TOKEN] -> preenche STATUS e BODY
req() {
  local method="$1" path="$2" data="${3:-}" token="${4:-}"
  local args=(-s -o /tmp/devbook_smoke_body -w '%{http_code}' -X "$method" "$BASE_URL$path")
  [[ -n "$data" ]] && args+=(-H 'Content-Type: application/json' --data "$data")
  [[ -n "$token" ]] && args+=(-H "Authorization: Bearer $token")
  rm -f /tmp/devbook_smoke_body
  STATUS="$(curl "${args[@]}" 2>/dev/null)"
  [[ -z "$STATUS" ]] && STATUS="000"
  BODY="$(cat /tmp/devbook_smoke_body 2>/dev/null)"
}

ok()   { PASS=$((PASS + 1)); printf 'OK    %s\n' "$1"; }
fail() { FAIL=$((FAIL + 1)); printf 'FALHA %s  (%s)\n' "$1" "$2"; }

# expect NOME STATUS_ESPERADO
expect() {
  if [[ "$STATUS" == "$2" ]]; then ok "$1 -> $STATUS"
  else fail "$1" "esperado $2, obtido $STATUS; corpo: ${BODY:0:120}"; fi
}

# check NOME FILTRO_JQ  (verdadeiro se o filtro jq sobre BODY der true)
check() {
  if [[ "$(printf '%s' "$BODY" | jq -r "$2" 2>/dev/null)" == "true" ]]; then ok "$1"
  else fail "$1" "filtro '$2' não bateu; corpo: ${BODY:0:120}"; fi
}

# token do login: aceita JSON {"token": "..."} ou texto puro (formato atual)
extract_token() {
  local t
  t="$(printf '%s' "$BODY" | jq -r '.token? // empty' 2>/dev/null)"
  [[ -z "$t" ]] && t="$(printf '%s' "$BODY" | tr -d '"\n ')"
  printf '%s' "$t"
}

echo "== DevBook smoke @ $BASE_URL (run $RUN)"

# ---------- cadastro ----------
A_EMAIL="a$RUN@devbook.test"; A_NICK="a$RUN"
B_EMAIL="b$RUN@devbook.test"; B_NICK="b$RUN"

req POST /usuarios "{\"nome\":\"Alice\",\"nick\":\"$A_NICK\",\"email\":\"$A_EMAIL\",\"senha\":\"$SENHA\"}"
expect "cadastrar usuário A" 201
A_ID="$(printf '%s' "$BODY" | jq -r '.id // empty' 2>/dev/null)"
check "N1 cadastro não expõe senha" 'has("senha") | not'

req POST /usuarios "{\"nome\":\"Bob\",\"nick\":\"$B_NICK\",\"email\":\"$B_EMAIL\",\"senha\":\"$SENHA\"}"
expect "cadastrar usuário B" 201
B_ID="$(printf '%s' "$BODY" | jq -r '.id // empty' 2>/dev/null)"

req POST /usuarios "{\"nome\":\"Alice2\",\"nick\":\"x$RUN\",\"email\":\"$A_EMAIL\",\"senha\":\"$SENHA\"}"
expect "[contrato] cadastrar e-mail duplicado" 409

req POST /usuarios "{\"nick\":\"y$RUN\",\"email\":\"y$RUN@devbook.test\",\"senha\":\"$SENHA\"}"
expect "cadastrar sem nome (validação)" 400

if [[ -z "$A_ID" || -z "$B_ID" ]]; then
  echo "Não foi possível cadastrar os usuários base; abortando."; exit 1
fi

# ---------- login ----------
req POST /login "{\"email\":\"$A_EMAIL\",\"senha\":\"errada\"}"
expect "login com senha errada" 401
BODY_SENHA_ERRADA="$BODY"

req POST /login "{\"email\":\"naoexiste$RUN@devbook.test\",\"senha\":\"errada\"}"
expect "login com e-mail inexistente" 401
if [[ "$BODY" == "$BODY_SENHA_ERRADA" ]]; then ok "N2 login não revela se o e-mail existe"
else fail "N2 login não revela se o e-mail existe" "corpos diferentes: '${BODY_SENHA_ERRADA:0:80}' vs '${BODY:0:80}'"; fi

req POST /login "{\"email\":\"$A_EMAIL\",\"senha\":\"$SENHA\"}"
expect "login A" 200
check "[contrato] H14 login responde JSON com token" 'has("token")'
TA="$(extract_token)"

req POST /login "{\"email\":\"$B_EMAIL\",\"senha\":\"$SENHA\"}"
expect "login B" 200
TB="$(extract_token)"

# ---------- usuários ----------
req GET "/usuarios?usuario=$A_NICK"
expect "listar usuários sem token" 401

req GET "/usuarios?usuario=$A_NICK" "" "$TA"
expect "listar usuários por nick" 200
check "listagem contém A" "map(.id) | index($A_ID) != null"

req GET "/usuarios/$A_ID" "" "$TA"
expect "[contrato] H13 buscar usuário em /usuarios/{id}" 200

req GET "/usuario/$A_ID" "" "$TA"
expect "buscar usuário na rota atual /usuario/{id}" 200

req GET "/usuario/999999999" "" "$TA"
expect "N7 buscar usuário inexistente (rota atual)" 404

req PUT "/usuarios/$A_ID" "{\"nome\":\"Alice Editada\",\"nick\":\"$A_NICK\",\"email\":\"$A_EMAIL\"}" "$TA"
expect "H8 atualizar perfil sem enviar senha" 204

req PUT "/usuarios/$B_ID" "{\"nome\":\"Hack\",\"nick\":\"$B_NICK\",\"email\":\"$B_EMAIL\",\"senha\":\"$SENHA\"}" "$TA"
expect "atualizar outro usuário" 403

# ---------- seguir ----------
req POST "/usuarios/$B_ID/seguir" "" "$TA"
expect "A segue B" 204

req POST "/usuarios/$A_ID/seguir" "" "$TB"
expect "B segue A" 204

req POST "/usuarios/$A_ID/seguir" "" "$TA"
expect "H4 seguir a si mesmo" 403

req GET "/usuarios/$A_ID/seguidores" "" "$TA"
expect "seguidores de A" 200
check "H4 A não virou seguidor de si mesmo" "map(.id) | index($A_ID) == null"

req GET "/usuarios/$B_ID/seguidores" "" "$TA"
expect "seguidores de B" 200
check "A está entre os seguidores de B" "map(.id) | index($A_ID) != null"

req GET "/usuarios/$A_ID/seguindo" "" "$TA"
expect "quem A segue" 200
check "N4 A segue B" "map(.id) | index($B_ID) != null"
check "N4 lista de seguindo não contém o próprio A" "map(.id) | index($A_ID) == null"

# ---------- publicações ----------
req POST /publicacoes "{\"titulo\":\"Post 1\",\"conteudo\":\"conteúdo 1\"}" "$TA"
expect "criar publicação" 201
P_ID="$(printf '%s' "$BODY" | jq -r '.id // empty' 2>/dev/null)"

req POST /publicacoes "{\"titulo\":\"Forjado\",\"conteudo\":\"tenta se passar por B\",\"autor_id\":$B_ID}" "$TA"
expect "criar publicação com autor_id forjado no corpo" 201
check "H2 autor é quem está logado, não o do corpo" ".autor_id == $A_ID"

req POST /publicacoes "{\"titulo\":\"Post 2\",\"conteudo\":\"conteúdo 2\"}" "$TA"
expect "criar segunda publicação" 201
P2_ID="$(printf '%s' "$BODY" | jq -r '.id // empty' 2>/dev/null)"

req POST /publicacoes "{\"titulo\":\"\",\"conteudo\":\"x\"}" "$TA"
expect "[contrato] criar publicação inválida" 400

req GET /publicacoes "" "$TB"
expect "feed de B (B segue A)" 200
check "feed de B contém post de A" "map(.id) | index(${P2_ID:-0}) != null"

req GET "/publicacoes/${P_ID:-0}" "" "$TB"
expect "buscar publicação" 200

req GET "/publicacoes/999999999" "" "$TB"
expect "N7 buscar publicação inexistente" 404

req GET "/publicacoes/usuario/$A_ID" "" "$TB"
expect "publicações do usuário A" 200
check "H15 publicações do usuário A é uma lista com P1 e P2" "type == \"array\" and (map(.id) | index(${P_ID:-0}) != null) and (map(.id) | index(${P2_ID:-0}) != null)"

req PUT "/publicacoes/${P_ID:-0}" "{\"titulo\":\"Hack\",\"conteudo\":\"hack\"}" "$TB"
expect "H3 editar publicação de outro usuário" 403

req PUT "/publicacoes/${P_ID:-0}" "{\"titulo\":\"Post 1 editado\",\"conteudo\":\"novo\"}" "$TA"
expect "editar própria publicação" 204

req PUT "/publicacoes/999999999" "{\"titulo\":\"x\",\"conteudo\":\"x\"}" "$TA"
expect "H3/N7 editar publicação inexistente" 404

# ---------- curtidas ----------
req POST "/publicacoes/${P_ID:-0}/curtir" "" "$TB"
expect "B curte post" 204

req POST "/publicacoes/${P_ID:-0}/curtir" "" "$TB"
expect "[contrato] N5 curtir de novo é idempotente" 204

req GET "/publicacoes/${P_ID:-0}" "" "$TB"
check "post tem 1 curtida" '.curtidas == 1'

req POST "/publicacoes/999999999/curtir" "" "$TB"
expect "N5 curtir publicação inexistente" 404

req POST "/publicacoes/${P_ID:-0}/descurtir" "" "$TB"
expect "B descurte post" 204

req GET "/publicacoes/${P_ID:-0}" "" "$TB"
check "post voltou a 0 curtidas" '.curtidas == 0'

# ---------- deletar publicação ----------
req DELETE "/publicacoes/${P_ID:-0}" "" "$TB"
expect "H3 deletar publicação de outro usuário" 403

req DELETE "/publicacoes/${P_ID:-0}" "" "$TA"
expect "N3 deletar própria publicação sem corpo" 204

req GET "/publicacoes/${P_ID:-0}" "" "$TA"
expect "publicação deletada não existe mais" 404

# ---------- parar de seguir ----------
req POST "/usuarios/$B_ID/parar-de-seguir" "" "$TA"
expect "A para de seguir B" 204

req POST "/usuarios/$A_ID/parar-de-seguir" "" "$TA"
expect "H4 parar de seguir a si mesmo" 403

req POST "/usuarios/$A_ID/parar-de-seguir" "" "$TB"
expect "B para de seguir A" 204

req GET "/usuarios/$B_ID/seguidores" "" "$TA"
check "B não tem mais A como seguidor" "(. // []) | map(.id) | index($A_ID) == null"

# ---------- senha ----------
req POST "/usuarios/$A_ID/atualizar-senha" "{\"atual\":\"errada\",\"nova\":\"$NOVA_SENHA\"}" "$TA"
expect "[contrato] atualizar senha com senha atual errada" 401

req POST "/usuarios/$B_ID/atualizar-senha" "{\"atual\":\"$SENHA\",\"nova\":\"$NOVA_SENHA\"}" "$TA"
expect "atualizar senha de outro usuário" 403

req POST "/usuarios/$A_ID/atualizar-senha" "{\"atual\":\"$SENHA\",\"nova\":\"$NOVA_SENHA\"}" "$TA"
expect "atualizar senha" 204

req POST /login "{\"email\":\"$A_EMAIL\",\"senha\":\"$NOVA_SENHA\"}"
expect "login com a senha nova" 200

# ---------- CORS ----------
CORS_HDR="$(curl -s -o /dev/null -D - -X OPTIONS "$BASE_URL/usuarios" \
  -H 'Origin: http://localhost:5173' -H 'Access-Control-Request-Method: POST' 2>/dev/null \
  | tr -d '\r' | grep -i '^access-control-allow-origin:' || true)"
if [[ -n "$CORS_HDR" ]]; then ok "[contrato] H16 preflight CORS"
else fail "[contrato] H16 preflight CORS" "sem Access-Control-Allow-Origin"; fi

# ---------- deletar usuário ----------
req DELETE "/usuarios/$B_ID"
expect "H6 deletar usuário sem token" 401

req DELETE "/usuarios/$B_ID" "" "$TA"
expect "deletar outro usuário" 403

req DELETE "/usuarios/$A_ID" "" "$TA"
expect "deletar a si mesmo" 204

req GET "/usuario/$A_ID" "" "$TB"
expect "N7 usuário deletado não existe mais (rota atual)" 404

req DELETE "/usuarios/$B_ID" "" "$TB"
expect "limpeza: deletar B" 204

echo "== resultado: $PASS ok, $FAIL falha(s)"
[[ "$FAIL" -eq 0 ]]
