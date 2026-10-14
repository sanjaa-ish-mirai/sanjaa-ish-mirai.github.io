# Vision Theory Lab agent workflow

The owner authorizes automatic commits and pushes for completed website work.

- Inspect the current branch, working tree, repository instructions, and existing behavior before editing.
- Preserve existing lessons, scientific correctness, localStorage state, notes, and v1 JSON backups.
- Keep the application static, accessible, responsive, and usable offline; use the existing vanilla CSS/JavaScript architecture.
- The owner’s primary goal is RGB/depth camera + LiDAR + IMU localization and understanding FAST-LIVO2. Teach prerequisites explicitly: mathematical fundamentals → signals/camera geometry → calibration/timing → IMU/filtering → LiDAR geometry/direct vision → FAST-LIVO2 source and evaluation. Keep deep learning available as an extension, not a mandatory prerequisite for this target. Preserve stable lesson IDs when recommending a different study order.
- Prefer meaningful, numerically checked visual experiments to decorative animation.
- Run the relevant browser, numerical, persistence, backup, responsive, and deployment checks before shipping.
- After successful checks, stage only task-related changes, write a concise Conventional Commit, and push the current branch to its configured upstream (or `origin` with the same branch name).
- Automatic commit/push is authorized; do not ask again for routine shipping. Required sandbox/tool approval remains applicable.
- Never force-push, rewrite published history, push secrets, include unrelated user changes, or commit failing work. If the remote changed, inspect and reconcile safely; do not overwrite it.
- Check the GitHub Pages workflow after pushing when accessible. Report the commit, branch, deployment status, checks, and material remaining limitations accurately.
