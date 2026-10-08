"""Online SQLite backup, retaining the last seven daily copies."""
import sqlite3
from pathlib import Path
from datetime import datetime, timezone

folder=Path('/var/lib/igra-1917')
backup_dir=folder/'backups'
backup_dir.mkdir(exist_ok=True)
target=backup_dir/('game-'+datetime.now(timezone.utc).strftime('%Y-%m-%d')+'.sqlite')
with sqlite3.connect(folder/'game.sqlite') as source, sqlite3.connect(target) as destination:
    source.backup(destination)
for old in sorted(backup_dir.glob('game-*.sqlite'),reverse=True)[7:]:
    old.unlink()
print('SQLite backup complete')
