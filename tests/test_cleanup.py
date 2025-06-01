import os
import time
from scripts.cleanup import cleanup_directory

def test_cleanup_directory(tmp_path):
    old_file = tmp_path / "old.txt"
    old_file.write_text("old")
    new_file = tmp_path / "new.txt"
    new_file.write_text("new")
    past = time.time() - 10 * 86400
    os.utime(old_file, (past, past))
    removed = cleanup_directory(str(tmp_path), days=7)
    assert str(old_file) in removed
    assert not old_file.exists()
    assert new_file.exists()
