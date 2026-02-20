# Пошаговая инструкция: исправление кодировки сообщений коммитов в Git

Если на GitHub в истории коммитов отображаются кракозябры вместо русского текста, перезапись истории с перекодировкой Windows-1251 → UTF-8 делается так.

**Важно:** выполняйте шаги в **Git Bash** (не в PowerShell и не в CMD). В конце аргумент — **`--all`** (две буквы **L**), не `--a11`.

---

## Шаг 1. Открыть Git Bash

Запустите **Git Bash** (меню Пуск → Git Bash или правый клик в папке проекта → Git Bash Here).

---

## Шаг 2. Перейти в каталог проекта

```bash
cd /c/Users/n.gladkov/Desktop/fitness-coach-system
```

Проверьте, что вы в нужной папке: в приглашении должно быть `~/Desktop/fitness-coach-system (main)`.

---

## Шаг 3. (По желанию) Сохранить незакоммиченные изменения

Если есть правки, которые не закоммичены:

```bash
git stash
```

Если вывода «No local changes to save» — ничего не делайте, переходите к шагу 4.

---

## Шаг 4. Указать скрипт по полному пути и запустить перезапись

Команда должна вызывать скрипт по **полному пути** (`$(pwd)/scripts/...`), иначе при запуске фильтра скрипт не будет найден.

Скопируйте команду **целиком** и вставьте в Git Bash (в конце именно **`--all`** с двумя буквами L):

```bash
FILTER_BRANCH_SQUELCH_WARNING=1 git filter-branch -f --msg-filter "sh $(pwd)/scripts/run-fix-encoding.sh" -- --all
```

Дождитесь окончания. В консоли будет прогресс вида `Rewrite ... (1/39)`, `(2/39)` и т.д.

---

## Шаг 5. Если что-то пошло не так (скрипт не найден и т.п.)

Вернуть ветку в состояние до перезаписи и удалить служебные refs:

```bash
git reset --hard refs/original/refs/heads/main
rm -rf .git/refs/original
```

После этого снова выполните команду из шага 4 (с `$(pwd)/scripts/run-fix-encoding.sh`).

---

## Шаг 6. Отправить обновлённую историю на GitHub

После успешного завершения `filter-branch`:

```bash
git push --force-with-lease
```

`--force-with-lease` безопаснее, чем `--force`: push отменится, если на remote появились новые коммиты.

---

## Шаг 7. Восстановить stash (если делали на шаге 3)

Если на шаге 3 выполняли `git stash`:

```bash
git stash pop
```

Если stash не делали — этот шаг пропустить.

---

## Краткая шпаргалка (всё по порядку)

```bash
cd /c/Users/n.gladkov/Desktop/fitness-coach-system
git stash
FILTER_BRANCH_SQUELCH_WARNING=1 git filter-branch -f --msg-filter "sh $(pwd)/scripts/run-fix-encoding.sh" -- --all
git push --force-with-lease
git stash pop
```

В последней команде `filter-branch` в конце обязательно **`--all`** (латинские буквы **a**, **l**, **l**).

**Если на GitHub всё ещё кракозябры:** скрипт `fix-git-commit-encoding.js` заменяет известные битые сообщения на английские. Повторите шаги 4–6 (при необходимости сначала сбросьте backup: `git reset --hard refs/original/refs/heads/main` и `rm -rf .git/refs/original`). Для новых коммитов используйте английский — см. docs/GIT_WORKFLOW.md.
