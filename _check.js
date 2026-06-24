
(function() {
  'use strict';

  // ── 常量 ──────────────────────────────
  const ROWS = 8;
  const COLS = 8;
  const TILE_SIZE = 54;
  const GAP = 3;
  const PADDING = 16;
  const INITIAL_MOVES = 50;
  const POINTS_PER_TILE = 10;

 const COLORS = {
   1: '#E74C3C',
    2: '#3498DB',
    3: '#2ECC71',
    4: '#F1C40F',
    5: '#9B59B6',
    6: '#E67E22',
   0: '#1a1a2e'
 };

  const GRAPE_H = 7;
  const GRAPE_V = 8;
  const RAINBOW = 9;

  function isSpecial(v) { return v === GRAPE_H || v === GRAPE_V || v === RAINBOW; }

  // ══════════════════════════════════════�?  // Board �?�?棋盘数据与操�?  // ══════════════════════════════════════�?  class Board {
    constructor(rows, cols) {
      this.rows = rows;
      this.cols = cols;
      this.grid = [];
    }

    // 生成无初始三连的随机棋盘
    generate(matchChecker) {
      this.grid = [];
      for (let r = 0; r < this.rows; r++) {
        this.grid[r] = [];
        for (let c = 0; c < this.cols; c++) {
          let value;
          let attempts = 0;
          do {
            value = Math.floor(Math.random() * 6) + 1;
            attempts++;
          } while (attempts < 200 && this._wouldMatch(r, c, value));
          this.grid[r][c] = value;
        }
      }
      // 全盘二次验证：如有遗漏的三连则重�?      if (matchChecker && matchChecker.findMatches(this.grid).length > 0) {
        this.generate(matchChecker);
      }
    }

    // �?(row, col) 放置 value 是否会构成三连（仅检查左方与上方已放置的格子�?    _wouldMatch(row, col, value) {
      if (col >= 2 &&
          this.grid[row][col - 1] === value &&
          this.grid[row][col - 2] === value) return true;
      if (row >= 2 &&
          this.grid[row - 1][col] === value &&
          this.grid[row - 2][col] === value) return true;
      return false;
    }

    swap(r1, c1, r2, c2) {
      const t = this.grid[r1][c1];
      this.grid[r1][c1] = this.grid[r2][c2];
      this.grid[r2][c2] = t;
    }

    isAdjacent(r1, c1, r2, c2) {
      return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
    }

    isInBounds(r, c) {
      return r >= 0 && r < this.rows && c >= 0 && c < this.cols;
    }

    // 移除一组格子（置为 0�?    removeCells(cells) {
      for (const { row, col } of cells) {
        this.grid[row][col] = 0;
      }
    }

    // 重力下落：返回移动记�?[{fromRow, toRow, col}]
    applyGravity() {
      const moves = [];
      for (let c = 0; c < this.cols; c++) {
        let writeRow = this.rows - 1;
        for (let r = this.rows - 1; r >= 0; r--) {
          if (this.grid[r][c] !== 0) {
            if (r !== writeRow) {
              this.grid[writeRow][c] = this.grid[r][c];
              this.grid[r][c] = 0;
              moves.push({ fromRow: r, toRow: writeRow, col: c });
            }
            writeRow--;
          }
        }
      }
      return moves;
    }

    // 顶部补充新方块，返回被填充的格子 [{row, col}]
    fillEmpty() {
      const filled = [];
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          if (this.grid[r][c] === 0) {
            this.grid[r][c] = Math.floor(Math.random() * 6) + 1;
            filled.push({ row: r, col: c });
          }
        }
      }
      return filled;
    }
  }

  // ══════════════════════════════════════�?  // Match �?�?匹配检�?  // ══════════════════════════════════════�? class Match {
    // 返回匹配分组 [{cells, length, orientation}]
    findMatchGroups(grid) {
      var rows = grid.length, cols = grid[0].length;
      var groups = [];
      // 横向扫描
      for (var r = 0; r < rows; r++) {
        var c = 0;
        while (c < cols) {
          var val = grid[r][c];
          if (val === 0 || isSpecial(val)) { c++; continue; }
          var count = 1;
          while (c + count < cols && grid[r][c + count] === val) count++;
          if (count >= 3) {
            var cells = [];
            for (var i = 0; i < count; i++) cells.push({row: r, col: c + i});
            groups.push({cells: cells, length: count, orientation: 'h'});
          }
          c += count;
        }
      }
      // 纵向扫描
      for (var cc = 0; cc < cols; cc++) {
        var rr = 0;
        while (rr < rows) {
          var val2 = grid[rr][cc];
          if (val2 === 0 || isSpecial(val2)) { rr++; continue; }
          var count2 = 1;
          while (rr + count2 < rows && grid[rr + count2][cc] === val2) count2++;
          if (count2 >= 3) {
            var cells2 = [];
            for (var j = 0; j < count2; j++) cells2.push({row: rr + j, col: cc});
            groups.push({cells: cells2, length: count2, orientation: 'v'});
          }
          rr += count2;
        }
      }
      return groups;
    }

    // 返回匹配格子的数�?[{row, col}, ...]
   findMatches(grid) {
      const rows = grid.length;
      const cols = grid[0].length;
      const matched = new Set();

      // 横向检�?      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols - 2; c++) {
         const val = grid[r][c];
          if (val === 0 || isSpecial(val)) continue;
          let count = 1;
          while (c + count < cols && grid[r][c + count] === val) count++;
          if (count >= 3) {
            for (let i = 0; i < count; i++) matched.add(r + ',' + (c + i));
          }
        }
      }

      // 纵向检�?      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows - 2; r++) {
         const val = grid[r][c];
          if (val === 0 || isSpecial(val)) continue;
          let count = 1;
          while (r + count < rows && grid[r + count][c] === val) count++;
          if (count >= 3) {
            for (let i = 0; i < count; i++) matched.add((r + i) + ',' + c);
          }
        }
      }

      return Array.from(matched).map(key => {
        const parts = key.split(',');
        return { row: +parts[0], col: +parts[1] };
      });
    }
  }

  // ══════════════════════════════════════�?  // Game �?�?游戏主控、渲染、动�?  // ══════════════════════════════════════�?  class Game {
    constructor(canvas, scoreEl, movesEl) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.scoreEl = scoreEl;
      this.movesEl = movesEl;

      this.board = new Board(ROWS, COLS);
      this.matcher = new Match();

     this.score = 0;
     this.movesLeft = INITIAL_MOVES;
     this.dragStart = null;
     this.state = 'idle';
      this.particles = [];

     // 动画状�?      this.animType = null;
      this.animProgress = 0;
      this.animDuration = 0;
      this.animData = null;
      this.animResolve = null;

      this.lastTime = 0;

      this._initCanvas();
      this.board.generate(this.matcher);
     this._updateUI();

     this.fruitImages = {};
      this.grapeImg = new Image(); this.grapeImg.src = 'grape.png';
      this.rainbowImg = new Image(); this.rainbowImg.src = 'rainbow.png';
     this._loadFruitImages();

      this._swapTarget = null;

     this.canvas.addEventListener('pointerdown', e => this._handlePointerDown(e));
      this.canvas.addEventListener('pointermove', e => this._handlePointerMove(e));
      this.canvas.addEventListener('pointerup', e => this._handlePointerUp(e));
      this.canvas.addEventListener('pointercancel', e => this._handlePointerUp(e));
     this._gameLoop = this._gameLoop.bind(this);
      this._animId = requestAnimationFrame(this._gameLoop);
    }

    _initCanvas() {
      var w = COLS * (TILE_SIZE + GAP) - GAP + PADDING * 2;
      var h = ROWS * (TILE_SIZE + GAP) - GAP + PADDING * 2;
      this.canvas.width = w;
      this.canvas.height = h;
    }

    _loadFruitImages() {
      for (var i = 1; i <= 6; i++) {
        var img = new Image();
        img.src = 'fruit_' + i + '.png';
        this.fruitImages[i] = img;
      }
    }

    _tileX(c) { return PADDING + c * (TILE_SIZE + GAP); }
    _tileY(r) { return PADDING + r * (TILE_SIZE + GAP); }

    _cellFromPos(clientX, clientY) {
      var rect = this.canvas.getBoundingClientRect();
      var sx = this.canvas.width / rect.width;
      var sy = this.canvas.height / rect.height;
      var x = (clientX - rect.left) * sx;
      var y = (clientY - rect.top) * sy;
      var c = Math.floor((x - PADDING) / (TILE_SIZE + GAP));
      var r = Math.floor((y - PADDING) / (TILE_SIZE + GAP));
      if (!this.board.isInBounds(r, c)) return null;
      var tx = this._tileX(c);
      var ty = this._tileY(r);
      if (x >= tx && x < tx + TILE_SIZE && y >= ty && y < ty + TILE_SIZE) {
        return { row: r, col: c };
      }
      return null;
    }

   _handlePointerDown(e) {
     if (this.state === 'animating') return;
     if (this.state === 'gameover') { this.restart(); return; }
     var cell = this._cellFromPos(e.clientX, e.clientY);
     if (!cell) return;
      var v = this.board.grid[cell.row][cell.col];
      // 点击葡萄直接激�?      if (v === GRAPE_H || v === GRAPE_V) {
        this._swapTarget = cell;
        this._activateGrape(cell.row, cell.col, v);
        return;
      }
     this.canvas.setPointerCapture(e.pointerId);
     this.dragStart = { row: cell.row, col: cell.col, ox: e.clientX, oy: e.clientY };
    }

   _handlePointerMove(e) {
      // keep for potential future visual feedback
    }

    _handlePointerUp(e) {
      if (!this.dragStart) return;
      this.canvas.releasePointerCapture(e.pointerId);
      var cell = this.dragStart;
      this.dragStart = null;

      var dx = e.clientX - cell.ox;
      var dy = e.clientY - cell.oy;
      var threshold = TILE_SIZE * 0.45;

      var target = null;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) {
        target = { row: cell.row, col: cell.col + (dx > 0 ? 1 : -1) };
      } else if (Math.abs(dy) > threshold) {
        target = { row: cell.row + (dy > 0 ? 1 : -1), col: cell.col };
      }

      if (target && this.board.isInBounds(target.row, target.col) &&
          this.board.isAdjacent(cell.row, cell.col, target.row, target.col)) {
        this._performSwap(cell, target);
      }
    }

   async _performSwap(cell1, cell2) {
      var v1 = this.board.grid[cell1.row][cell1.col];
      var v2 = this.board.grid[cell2.row][cell2.col];

     this.state = 'animating';

      // 彩虹�?+ 超级葡萄 �?组合技
      if ((v1 === RAINBOW && (v2 === GRAPE_H || v2 === GRAPE_V)) ||
          (v2 === RAINBOW && (v1 === GRAPE_H || v1 === GRAPE_V))) {
        var grapeVal = (v1 === GRAPE_H || v1 === GRAPE_V) ? v1 : v2;
        await this._comboRainbowGrape(grapeVal);
        this._finishTurn();
        return;
      }

      // 彩虹�?+ 普通水�?�?清除全场同类�?      if (v1 === RAINBOW && v2 >= 1 && v2 <= 6) {
        await this._activateRainbow(cell1, cell2, v2);
        this._finishTurn();
        return;
      }
      if (v2 === RAINBOW && v1 >= 1 && v1 <= 6) {
        await this._activateRainbow(cell2, cell1, v1);
        this._finishTurn();
        return;
      }

     this.board.swap(cell1.row, cell1.col, cell2.row, cell2.col);
      this._swapTarget = cell2; // 交换终点用于放置特殊水果
     await this._animate('swap', 180, { cell1: cell1, cell2: cell2 });

      var matches = this.matcher.findMatches(this.board.grid);

      if (matches.length === 0) {
        this.board.swap(cell1.row, cell1.col, cell2.row, cell2.col);
        await this._animate('swap_back', 180, { cell1: cell1, cell2: cell2 });
      } else {
       this.movesLeft--;
       this._updateUI();
        await this._processChain(this._swapTarget);
     }

      this._finishTurn();
    }

    _finishTurn() {
     if (this.movesLeft <= 0) {
        this.state = 'gameover';
      } else {
        this.state = 'idle';
      }
      this._updateUI();
    }

    async _processChain(swapTarget) {
      var groups = this.matcher.findMatchGroups(this.board.grid);

      while (groups.length > 0) {
        var fives = [], fours = [], threes = [], grapeGroups = [];
        for (var gi = 0; gi < groups.length; gi++) {
          var g = groups[gi];
          var hasGrape = false;
          for (var gj = 0; gj < g.cells.length; gj++) {
            var cv = this.board.grid[g.cells[gj].row][g.cells[gj].col];
            if (cv === GRAPE_H || cv === GRAPE_V) { hasGrape = true; break; }
          }
          if (hasGrape) { grapeGroups.push(g); }
          else if (g.length >= 5) { fives.push(g); }
          else if (g.length === 4) { fours.push(g); }
          else { threes.push(g); }
        }

        // 五连 �?彩虹�?        for (var fi = 0; fi < fives.length; fi++) {
          var fg = fives[fi];
          for (var fj = 0; fj < fg.cells.length; fj++) this.board.grid[fg.cells[fj].row][fg.cells[fj].col] = 0;
          if (swapTarget && this.board.isInBounds(swapTarget.row, swapTarget.col)) {
            this.board.grid[swapTarget.row][swapTarget.col] = RAINBOW;
          }
          this.score += fg.cells.length * 10;
        }

        // 四连 �?超级葡萄
        for (var fri = 0; fri < fours.length; fri++) {
          var frg = fours[fri];
          var keepIdx = Math.floor(frg.cells.length / 2);
          for (var frj = 0; frj < frg.cells.length; frj++) {
            if (frj !== keepIdx) this.board.grid[frg.cells[frj].row][frg.cells[frj].col] = 0;
          }
          this.board.grid[frg.cells[keepIdx].row][frg.cells[keepIdx].col] = frg.orientation === 'h' ? GRAPE_H : GRAPE_V;
          this.score += frg.cells.length * 10;
        }

        // 葡萄参与匹配 �?激�?        for (var ggi = 0; ggi < grapeGroups.length; ggi++) {
          var gg = grapeGroups[ggi], grapeRow = -1, grapeCol = -1, grapeVal = 0;
          for (var ggj = 0; ggj < gg.cells.length; ggj++) {
            var gv = this.board.grid[gg.cells[ggj].row][gg.cells[ggj].col];
            if (gv === GRAPE_H || gv === GRAPE_V) { grapeRow = gg.cells[ggj].row; grapeCol = gg.cells[ggj].col; grapeVal = gv; break; }
          }
          if (grapeRow >= 0) {
            for (var ggk = 0; ggk < gg.cells.length; ggk++) this.board.grid[gg.cells[ggk].row][gg.cells[ggk].col] = 0;
            this._activateGrapeEffect(grapeRow, grapeCol, grapeVal);
          }
        }

        // 收集所有匹配格子用于粒子和三连移除
        var allMatched = [];
        for (var ai = 0; ai < groups.length; ai++) {
          for (var aj = 0; aj < groups[ai].cells.length; aj++) allMatched.push(groups[ai].cells[aj]);
        }
        var matchSet = new Set(allMatched.map(function(m) { return m.row + ',' + m.col; }));
        // 移除普通三�?        for (var ti = 0; ti < threes.length; ti++) {
          for (var tj = 0; tj < threes[ti].cells.length; tj++) {
            this.board.grid[threes[ti].cells[tj].row][threes[ti].cells[tj].col] = 0;
          }
        }
        this.score += (allMatched.length > 0 ? allMatched.length * 10 : 0);
        this._updateUI();

        // 果汁粒子喷射
        for (var mi = 0; mi < allMatched.length; mi++) {
          var mc = allMatched[mi];
          var color = COLORS[1 + Math.floor(Math.random() * 6)];
          this._spawnParticles(this._tileX(mc.col) + TILE_SIZE / 2, this._tileY(mc.row) + TILE_SIZE / 2, color);
        }

       await this._animate('remove', 200, { cellSet: matchSet });

       var fallMoves = this.board.applyGravity();

        if (fallMoves.length > 0) {
          var fallMap = new Map();
          for (var i = 0; i < fallMoves.length; i++) {
            var m = fallMoves[i];
            fallMap.set(m.toRow + ',' + m.col, m.fromRow);
          }
          await this._animate('fall', 280, { fallMap: fallMap });
       }

        var filled = this.board.fillEmpty();
        if (filled.length > 0) {
          var fillSet = new Set(filled.map(function(f) { return f.row + ',' + f.col; }));
          await this._animate('fill', 200, { cellSet: fillSet });
        }

        groups = this.matcher.findMatchGroups(this.board.grid);
     }
    }

    _animate(type, duration, data) {
      var self = this;
      return new Promise(function(resolve) {
        self.animType = type;
        self.animDuration = duration;
        self.animProgress = 0;
        self.animData = data;
        self.animResolve = resolve;
      });
    }

    _gameLoop(timestamp) {
      if (!this.lastTime) this.lastTime = timestamp;
      var dt = Math.min(timestamp - this.lastTime, 50);
      this.lastTime = timestamp;

      if (this.animType) {
        this.animProgress += dt;
        if (this.animProgress >= this.animDuration) {
          this.animProgress = this.animDuration;
          var resolve = this.animResolve;
          this.animType = null;
          this.animData = null;
          this.animResolve = null;
          if (resolve) resolve();
        }
     }

      // 粒子更新
      for (var pi = this.particles.length - 1; pi >= 0; pi--) {
        var p = this.particles[pi];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12;
        p.life -= 0.025;
        if (p.life <= 0) this.particles.splice(pi, 1);
      }

     this._render();
      this._animId = requestAnimationFrame(this._gameLoop);
    }

    _render() {
      var ctx = this.ctx;
      var W = this.canvas.width;
      var H = this.canvas.height;
      var t = this.animType ? this.animProgress / this.animDuration : 0;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#0f0f23';
      ctx.fillRect(0, 0, W, H);

      // 棋盘底色
      var bx = PADDING - 4, by = PADDING - 4;
      var bw = COLS * (TILE_SIZE + GAP) - GAP + 8;
      var bh = ROWS * (TILE_SIZE + GAP) - GAP + 8;
      ctx.fillStyle = '#141428';
      this._roundRect(bx, by, bw, bh, 6);
      ctx.fill();

      // 绘制所有格�?      for (var r = 0; r < ROWS; r++) {
        for (var c = 0; c < COLS; c++) {
          var value = this.board.grid[r][c];
          var dx = this._tileX(c);
          var dy = this._tileY(r);
          var alpha = 1;
          var scale = 1;

          if (this.animType === 'swap' || this.animType === 'swap_back') {
            var cell1 = this.animData.cell1;
            var cell2 = this.animData.cell2;
            if (r === cell1.row && c === cell1.col) {
              dx = this._lerp(this._tileX(cell2.col), this._tileX(cell1.col), t);
              dy = this._lerp(this._tileY(cell2.row), this._tileY(cell1.row), t);
            } else if (r === cell2.row && c === cell2.col) {
              dx = this._lerp(this._tileX(cell1.col), this._tileX(cell2.col), t);
              dy = this._lerp(this._tileY(cell1.row), this._tileY(cell2.row), t);
            }
          } else if (this.animType === 'remove') {
            if (this.animData.cellSet.has(r + ',' + c)) {
              alpha = 1 - t;
              scale = 1 - t * 0.5;
            }
          } else if (this.animType === 'fall') {
            var fromRow = this.animData.fallMap.get(r + ',' + c);
            if (fromRow !== undefined) {
              var et = this._easeOutQuad(t);
              dy = this._lerp(this._tileY(fromRow), this._tileY(r), et);
            }
          } else if (this.animType === 'fill') {
            if (this.animData.cellSet.has(r + ',' + c)) {
              alpha = t;
              scale = 0.3 + t * 0.7;
            }
          }

          if (alpha > 0.005 && value !== 0) {
            this._drawTile(value, dx, dy, alpha, scale);
          }
        }
      }

      // 拖拽高亮
      if (this.dragStart && this.state === 'idle') {
        var sc = this.dragStart;
        var sx = this._tileX(sc.col), sy = this._tileY(sc.row);
        ctx.save();
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#FFF';
        ctx.shadowBlur = 10;
        this._roundRect(sx, sy, TILE_SIZE, TILE_SIZE, 5);
        ctx.stroke();
        ctx.restore();
     }

      // 绘制粒子
      for (var pi = 0; pi < this.particles.length; pi++) {
        var p = this.particles[pi];
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.5 + p.life * 0.5), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

     // 游戏结束遮罩
      if (this.state === 'gameover') {
        ctx.fillStyle = 'rgba(10, 10, 30, 0.78)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 30px "Microsoft YaHei", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('游戏结束', W / 2, H / 2 - 28);
        ctx.font = '19px "Microsoft YaHei", Arial, sans-serif';
        ctx.fillText('最终分�? ' + this.score, W / 2, H / 2 + 18);
        ctx.font = '15px "Microsoft YaHei", Arial, sans-serif';
        ctx.fillStyle = '#999';
        ctx.fillText('拖拽方块重新开�?, W / 2, H / 2 + 54);
      }
    }

    _drawTile(value, x, y, alpha, scale) {
      var ctx = this.ctx;
      ctx.save();
      ctx.globalAlpha = alpha;

      var hs = TILE_SIZE / 2;
      var cx = x + hs, cy = y + hs;
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      ctx.translate(-cx, -cy);

     // 阴影
     ctx.shadowColor = 'rgba(0,0,0,0.35)';
      ctx.shadowBlur = 5;
      ctx.shadowOffsetY = 2;

     // 水果图片 �?纯色填充（图片未加载时的回退�?      var img;
      if (value === GRAPE_H || value === GRAPE_V) {
        img = this.grapeImg;
      } else if (value === RAINBOW) {
        img = this.rainbowImg;
      } else {
        img = this.fruitImages[value];
      }

      if (img && img.complete && img.naturalWidth > 0) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        // 特殊水果脉冲光晕
        if (value === GRAPE_H || value === GRAPE_V || value === RAINBOW) {
          var glowAlpha = 0.3 + Math.sin(Date.now() * 0.005) * 0.2;
          ctx.shadowColor = value === RAINBOW ? '#FFD700' : '#00FF88';
          ctx.shadowBlur = 8 + Math.sin(Date.now() * 0.005) * 4;
        }
        // 圆角裁剪
        ctx.beginPath();
        this._roundRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2, 5);
        ctx.clip();
        ctx.drawImage(img, x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
        // 葡萄方向标记
        if (value === GRAPE_H || value === GRAPE_V) {
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#FFF';
          ctx.font = 'bold 14px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          var mark = value === GRAPE_H ? '←→' : '↑↓';
          ctx.fillText(mark, x + TILE_SIZE / 2, y + TILE_SIZE - 10);
        }
     } else {
        var fallbackColor = value === GRAPE_H || value === GRAPE_V ? '#44FF88' : (value === RAINBOW ? '#FFD700' : (COLORS[value] || '#334'));
        ctx.fillStyle = fallbackColor;
        this._roundRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2, 5);
        ctx.fill();
      }

     ctx.restore();
    }

    _roundRect(x, y, w, h, r) {
      var ctx = this.ctx;
      if (typeof r === 'number') r = [r, r, r, r];
      ctx.beginPath();
      ctx.moveTo(x + r[0], y);
      ctx.lineTo(x + w - r[1], y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r[1]);
      ctx.lineTo(x + w, y + h - r[2]);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r[2], y + h);
      ctx.lineTo(x + r[3], y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r[3]);
      ctx.lineTo(x, y + r[0]);
      ctx.quadraticCurveTo(x, y, x + r[0], y);
      ctx.closePath();
    }

    _lerp(a, b, t) { return a + (b - a) * t; }
    _easeOutQuad(t) { return t * (2 - t); }

    _spawnParticles(x, y, color) {
      var count = 6 + Math.floor(Math.random() * 5);
      for (var j = 0; j < count; j++) {
        var angle = Math.random() * Math.PI * 2;
        var speed = 1.2 + Math.random() * 3.5;
        this.particles.push({
          x: x, y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.5,
          life: 1.0,
          color: color,
          size: 2 + Math.random() * 4
        });
      }
    }

   _updateUI() {
      this.scoreEl.textContent = this.score;
      this.movesEl.textContent = this.movesLeft;
    }

    _activateGrape(row, col, value) {
      this.movesLeft--;
      this._updateUI();
      this.state = 'animating';
      this._swapTarget = {row: row, col: col};
      // 清除格子后立即激�?      var cleared = [];
      if (value === GRAPE_H) {
        for (var cc = 0; cc < COLS; cc++) {
          if (this.board.grid[row][cc] !== 0) {
            if (cc !== col) this.board.grid[row][cc] = 0;
            cleared.push({row: row, col: cc});
          }
        }
      } else {
        for (var rr = 0; rr < ROWS; rr++) {
          if (this.board.grid[rr][col] !== 0) {
            if (rr !== row) this.board.grid[rr][col] = 0;
            cleared.push({row: rr, col: col});
          }
        }
      }
      this.board.grid[row][col] = 0;
      this.score += cleared.length * 10;
      this._updateUI();
      // 粒子
      for (var ci = 0; ci < cleared.length; ci++) {
        this._spawnParticles(this._tileX(cleared[ci].col) + TILE_SIZE / 2, this._tileY(cleared[ci].row) + TILE_SIZE / 2, COLORS[1 + Math.floor(Math.random() * 6)]);
      }
      // 继续链式处理
      var self2 = this;
      setTimeout(function() {
        self2._processChain(self2._swapTarget).then(function() {
          self2._finishTurn();
        });
      }, 100);
    }

    _activateGrapeEffect(row, col, value) {
      if (value === GRAPE_H) {
        for (var cc = 0; cc < COLS; cc++) {
          if (this.board.grid[row][cc] !== 0) {
            this.board.grid[row][cc] = 0;
            this.score += 10;
          }
        }
      } else {
        for (var rr = 0; rr < ROWS; rr++) {
          if (this.board.grid[rr][col] !== 0) {
            this.board.grid[rr][col] = 0;
            this.score += 10;
          }
        }
      }
      this._updateUI();
    }

    async _activateRainbow(rainbowCell, targetCell, targetType) {
      this.board.swap(rainbowCell.row, rainbowCell.col, targetCell.row, targetCell.col);
      await this._animate('swap', 180, { cell1: rainbowCell, cell2: targetCell });
      var cleared = [];
      for (var r = 0; r < ROWS; r++) {
        for (var c = 0; c < COLS; c++) {
          if (this.board.grid[r][c] === targetType) {
            this.board.grid[r][c] = 0;
            cleared.push({row: r, col: c});
          }
        }
      }
      this.board.grid[rainbowCell.row][rainbowCell.col] = 0;
      this.movesLeft--;
      this.score += cleared.length * 10;
      this._updateUI();
      // 粒子
      for (var ci = 0; ci < cleared.length; ci++) {
        this._spawnParticles(this._tileX(cleared[ci].col) + TILE_SIZE / 2, this._tileY(cleared[ci].row) + TILE_SIZE / 2, COLORS[targetType]);
      }
      // 下落填充
      var fallMoves = this.board.applyGravity();
      if (fallMoves.length > 0) {
        var fallMap = new Map();
        for (var fm = 0; fm < fallMoves.length; fm++) fallMap.set(fallMoves[fm].toRow + ',' + fallMoves[fm].col, fallMoves[fm].fromRow);
        await this._animate('fall', 280, { fallMap: fallMap });
      }
      var filled = this.board.fillEmpty();
      if (filled.length > 0) {
        var fillSet = new Set(filled.map(function(f) { return f.row + ',' + f.col; }));
        await this._animate('fill', 200, { cellSet: fillSet });
      }
      await this._processChain(this._swapTarget);
    }

    async _comboRainbowGrape(grapeVal) {
      this.movesLeft--;
      this._updateUI();
      // 将所有普通水�?1-6)转换为同方向葡萄
      var converted = [];
      for (var r = 0; r < ROWS; r++) {
        for (var c = 0; c < COLS; c++) {
          if (this.board.grid[r][c] >= 1 && this.board.grid[r][c] <= 6) {
            this.board.grid[r][c] = grapeVal;
            converted.push({row: r, col: c});
          }
        }
      }
      // 激活所有葡�?      for (var ci = 0; ci < converted.length; ci++) {
        this._activateGrapeEffect(converted[ci].row, converted[ci].col, grapeVal);
      }
      // 下落填充
      var fallMoves = this.board.applyGravity();
      if (fallMoves.length > 0) {
        var fallMap = new Map();
        for (var fm = 0; fm < fallMoves.length; fm++) fallMap.set(fallMoves[fm].toRow + ',' + fallMoves[fm].col, fallMoves[fm].fromRow);
        await this._animate('fall', 280, { fallMap: fallMap });
      }
      var filled = this.board.fillEmpty();
      if (filled.length > 0) {
        var fillSet = new Set(filled.map(function(f) { return f.row + ',' + f.col; }));
        await this._animate('fill', 200, { cellSet: fillSet });
      }
      await this._processChain(this._swapTarget);
    }

    _updateUI() {
      this.scoreEl.textContent = this.score;
      this.movesEl.textContent = this.movesLeft;
    }

    restart() {
      this.score = 0;
      this.movesLeft = INITIAL_MOVES;
     this.dragStart = null;
      this._swapTarget = null;
     this.particles = [];
     this.state = 'idle';
      this.animType = null;
      this.animData = null;
      this.board.generate(this.matcher);
      this._updateUI();
    }

    destroy() {
      if (this._animId) cancelAnimationFrame(this._animId);
    }
  }

  // ── 启动 ──────────────────────────────
  var canvas = document.getElementById('game-canvas');
  var scoreEl = document.getElementById('score-val');
  var movesEl = document.getElementById('moves-val');
  var resetBtn = document.getElementById('reset-btn');

  var game = new Game(canvas, scoreEl, movesEl);
  resetBtn.addEventListener('click', function() { game.restart(); });

})();

