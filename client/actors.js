/*
  
  NodeGame: Shooter
  Copyright (c) 2010 Ivo Wetzel.
  
  All rights reserved.
  
  NodeGame: Shooter is free software: you can redistribute it and/or
  modify it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  NodeGame: Shooter is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License along with
  NodeGame: Shooter. If not, see <http://www.gnu.org/licenses/>.
  
*/


// Actors ----------------------------------------------------------------------
// -----------------------------------------------------------------------------
var ActorPlayer = Client.createActorType('player', 2);
ActorPlayer.onCreate = function(data, complete) {
    this.r = data[0];
    this.mr = data[1]; 
    this.defense = data[2];
    this.thrust = data[3];
    this.boost = data[4];
    this.shield = data[5];
    this.fade = data[6];
    this.missiles = data[7];
    this.id = data[8];
    
    this.mor = data[7];
    this.mmr = 0;
    this.alpha = 1.0;
};

ActorPlayer.onUpdate = function(data) {
    this.r = data[0];
    this.mr = data[1]; 
    this.defense = data[2];
    this.thrust = data[3];
    this.boost = data[4];
    if (this.fade == -1 && data[6] != -1) {
        this.$.playSound('fadeOut');
    }
    if (this.fade == -2 && data[6] != -2) {
        this.$.playSound('fadeIn');
    }
    this.fade = data[6];
    
    // Shield
    if (this.fade != -1) {
        this.alpha = this.id == this.$.id ? 0.20 + (this.fade / 100 * 0.8)
                                          : this.fade / 100;
    
    } else {
        this.alpha = 1.0;
    }
    
    var col = this.$.colorCodes[this.$.playerColors[this.id]];
    if (this.shield && !data[5]) {
        this.$.playSound('powerOff');
        this.$.effectRing(this.x, this.y, 20,
                          {'n': 30, 'd': 0.5, 's': 2.75,
                           'c': col, 'a': this.alpha});
    
    } else if (!this.shield && data[5]) {
        this.$.playSound('powerOn');
        this.$.effectRing(this.x, this.y, 35, 
                          {'n': 30, 'd': 0.2, 's': -2.75,
                           'c': col, 'a': this.alpha});
    }
    this.shield = data[5];
    
    // Missiles
    if (data[7] > this.missiles) {
        this.$.playSound('powerOn');
        this.mmr = 0;
        this.mor = data[7];
        for(var i = 0; i < data[7]; i++) {
            if (i >= this.missiles) {
                var r = this.$.wrapAngle((Math.PI * 2 / this.mor * i) - Math.PI + this.mmr);
                var size = 26 + Math.cos(this.mmr * 2);
                var ox = this.x + Math.sin(r) * size;
                var oy = this.y + Math.cos(r) * size;
                if (ox < -16) {
                    ox += this.$.width + 32;
                
                } else if (ox > this.$.width + 16) {
                    ox -= this.$.width + 32;
                }
                if (oy < -16) {
                    oy += this.$.height + 32;
                
                } else if (oy > this.$.height + 16) {
                    oy -= this.$.height + 32;
                }
                
                this.$.effectExplosion(ox, oy, 6, {'d': 0.25, 's': 1, 'c': col});
                this.$.effectArea(ox, oy, {'s': 3.5, 'd': 0.25, 'c': col});
            }
        }
    }
    this.missiles = data[7];
};

ActorPlayer.onInterleave = function(step) {
    this.r = this.$.wrapAngle(this.r + this.mr / step);
    this.$.wrapPosition(this);
};

ActorPlayer.onDestroy = function(complete) {
    if (complete) {
        var col = this.$.colorCodes[this.$.playerColors[this.id]];
        this.$.effectExplosion(this.x, this.y, 20, {'d': 0.9, 's': 1.4, 'c': col});
        this.$.effectArea(this.x, this.y, {'s': 20, 'd': 0.5, 'c': col});
        
        if (this.shield) {
            this.$.effectRing(this.x, this.y, 20,
                              {'n': 42, 'd': 0.6, 's': 3.25,
                               'c': col, 'a': this.alpha});
        }
        for(var i = 0; i < this.missiles; i++) {
            var r = this.$.wrapAngle((Math.PI * 2 / this.mor * i) - Math.PI + this.mmr);
            var size = 26 + Math.cos(this.mmr * 2);
            var ox = this.x + Math.sin(r) * size;
            var oy = this.y + Math.cos(r) * size;
            
            this.$.effectExplosion(ox, oy, 6, {'d': 0.45, 's': 1, 'c': col});
            this.$.effectArea(ox, oy, {'s': 8.5, 'd': 0.45, 'c': col});
        }
        this.$.playSound('explosionShip');
    }
};

ActorPlayer.onDraw = function() {
    // Color
    var col = this.$.playerColor(this.id);
    var colFaded = this.$.playerColorFaded(this.id);
    this.$.alpha(this.alpha);
    
    // Draw Ship base
    if (this.fade > 0 || this.fade == -1 || this.id == this.$.id) {
        this.$.line(3);
        this.$.stroke(this.defense ? colFaded : col);
        
        this.$.bg.save();
        this.$.bg.translate(this.x, this.y);
        this.$.bg.rotate(Math.PI - this.r);
        
        this.$.bg.beginPath();
        this.$.bg.moveTo(0, -12);
        this.$.bg.lineTo(10 , 12);
        this.$.bg.lineTo(-10, 12);
        this.$.bg.lineTo(0, -12);
        this.$.bg.closePath();
        this.$.bg.stroke();
        
        if (this.shield) {
            this.$.strokeCircle(0, 0, 20, 3, colFaded);
        }
        this.$.bg.restore();
        
        // Effects
        if (this.thrust) {
            var r = this.$.wrapAngle(this.r - Math.PI);
            var ox = this.x + Math.sin(r) * 12;
            var oy = this.y + Math.cos(r) * 12;
            var rr = [-0.9, -0.5, -0.25, 0.25, 0.5, 0.9];
            for(var i = 0; i < (this.boost ? 2 : 1); i++) {
                this.$.effectParticle(ox, oy,
                        this.$.wrapAngle(r - rr[Math.floor(Math.random() * 6)]),
                        {'s': 1.6, 'd': 0.2 + (this.boost ? 0.1 : 0),
                         'c': col, 'a': this.alpha});
            }
        }
        
        // Rotate
        if (this.mr != 0) {
            var d = this.mr > 0 ? 1 : -1; 
            var r = this.$.wrapAngle(this.r - Math.PI);
            var ox = this.x + Math.sin(this.$.wrapAngle(r - Math.PI * 2.22 * d))
                              * 14;
            
            var oy = this.y + Math.cos(this.$.wrapAngle(r - Math.PI * 2.22 * d))
                              * 14;
            
            r = r - Math.PI * 2.47 * d - 0.4 + Math.random() * 0.80;
            r = this.$.wrapAngle(r);
            
            this.$.effectParticle(ox, oy, r, {'s': 2, 'd': 0.10,
                                              'c': col, 'a': this.alpha});
        }
        
        // Shield ring
        if (this.shield) {
            this.$.alpha(0.25 * this.alpha);
            this.$.strokeCircle(this.x, this.y, 20 + (Math.random() + 0.5),
                                1.5, col);
            
            this.$.alpha((Math.random() / 4 + 0.25) * this.alpha );
            this.$.strokeCircle(this.x, this.y, 20 + (Math.random() + 0.5),
                                3.5 + Math.random() * 2, col);
            
            this.$.fill(colFaded);
            
            var count =  22 * (Math.random() / 2 + 0.75);
            var size = 19 + (Math.random() + 0.5);
            for(var i = 0; i < count; i++) {
                var r = (Math.PI * 2 / count * i) - Math.PI;
                var e = Math.random() / 2 + 0.5;
                var ox = this.x + Math.sin(r) * size;
                var oy = this.y + Math.cos(r) * size;
                
                var a = (this.alpha * 0.5)
                this.$.alpha(Math.min(a * 2, 1.0));
                this.$.bg.fillRect(ox - 2, oy - 2, 4, 4);
            }
        }
        
        // Missile Ring
        if (this.missiles > 0) {
            if (this.mor < this.missiles) {
                this.mor += 0.05;
            
            } else if (this.mor > this.missiles) {
                this.mor -= 0.05;
            }
            for(var i = 0; i < this.missiles; i++) {
                var r = (Math.PI * 2 / this.mor * i) - Math.PI + this.mmr;
                r = this.$.wrapAngle(r);
                
                var size = 26 + Math.cos(this.mmr * 2);
                var ox = this.x + Math.sin(r) * size;
                var oy = this.y + Math.cos(r) * size;
                if (ox < -16) {
                    ox += this.$.width + 32;
                
                } else if (ox > this.$.width + 16) {
                    ox -= this.$.width + 32;
                }
                if (oy < -16) {
                    oy += this.$.height + 32;
                
                } else if (oy > this.$.height + 16) {
                    oy -= this.$.height + 32;
                }
                
                this.$.alpha(this.alpha * 0.5);
                this.$.fillCircle(ox, oy, 5, col);
                
                this.$.alpha(this.alpha);
                this.$.bg.fillRect(ox - 2, oy - 2, 4, 4);
            }
            this.mmr += 0.1;
        }
    
    } else {
        this.shield = false;
    }
    
    // Name
    if (this.fade > 0 || this.fade == -1 || this.id == this.$.id) {
        if (this.$.playerNames[this.id]) {
            this.$.alpha(this.alpha);
            this.$.fill(colFaded);
            this.$.text(this.x, this.y - 27,
                        this.$.playerNames[this.id] + '('
                        + this.$.playerScores[this.id] + ')',
                        'center', 'middle');
        }
    }
    this.$.alpha(1.0);
};


// Bullet ----------------------------------------------------------------------
var ActorBullet = Client.createActorType('bullet', 10);
ActorBullet.onCreate = function(data, complete) {
    this.id = data[0];
    this.col = this.$.playerColor(this.id);;
    if (complete) {
        this.$.playSound('launchSmall');
    }
};

ActorBullet.onDestroy = function(complete) {
    if (complete) {
        this.$.effectExplosion(this.x, this.y, 4, {'d': 0.35, 's': 1, 'c': this.col});
        this.$.effectArea(this.x, this.y, {'s': 3.5, 'd': 0.35, 'c': this.col});
        this.$.playSound('explosionSmall'); 
    }
};

ActorBullet.onInterleave = function(diff) {
    this.$.wrapPosition(this);
};

ActorBullet.onDraw = function() {
    this.$.fillCircle(this.x, this.y, 2.9, this.col);
};


// Missile ---------------------------------------------------------------------
var ActorMissile = Client.createActorType('missile', 2);
ActorMissile.onCreate = function(data, complete) {
    this.id = data[0];
    this.r = data[1];
    this.col = this.$.playerColor(this.id);;
    
    if (complete) {
        this.$.effectExplosion(this.x, this.y, 4, {'d': 0.35, 's': 1, 'c': this.col});
        this.$.effectArea(this.x, this.y, {'s': 3.5, 'd': 0.35, 'c': this.col});
        this.$.playSound('launchMedium');
    }
};

ActorMissile.onUpdate = function(data) {
    this.r = data[0];
};

ActorMissile.onDestroy = function(complete) {
    if (complete) {
        this.$.effectExplosion(this.x, this.y, 6,{'d': 0.45, 's': 1, 'c': this.col});
        this.$.effectArea(this.x, this.y, {'s': 8.5, 'd': 0.45, 'c': this.col});
        this.$.playSound('explosionMedium');
    }
};

ActorMissile.onInterleave = function(diff) {
    this.$.wrapPosition(this);
};

ActorMissile.onDraw = function() {
    var col = this.$.playerColor(this.id);
    this.$.line(3);
    this.$.fill(col);
    
    this.$.bg.save();
    this.$.bg.translate(this.x, this.y);
    this.$.bg.rotate(Math.PI - this.r);
    
    this.$.alpha(0.35);
    this.$.bg.scale(0.7, 0.7);
    this.$.bg.beginPath();
    this.$.bg.moveTo(0, -12);
    this.$.bg.lineTo(8 , 12);
    this.$.bg.lineTo(-8, 12);
    this.$.bg.lineTo(0, -12);
    this.$.bg.closePath();
    this.$.bg.fill();
    
    this.$.alpha(1.0);
    this.$.bg.scale(0.7, 0.7);
    this.$.bg.beginPath();
    this.$.bg.moveTo(0, -12);
    this.$.bg.lineTo(8 , 12);
    this.$.bg.lineTo(-8, 12);
    this.$.bg.lineTo(0, -12);
    this.$.bg.closePath();
    this.$.bg.fill();
    
    this.$.bg.restore();
    
    var r = this.$.wrapAngle(this.r - Math.PI);
    var ox = this.x + Math.sin(r) * 4;
    var oy = this.y + Math.cos(r) * 4;
    
    var rr = [-0.75, -0.0, 0.75];
    this.$.effectParticle(ox, oy,
                          this.$.wrapAngle(r - rr[Math.floor(Math.random() * 3)]),
                          {'s': 0.15, 'd': 0.25, 'c': col, 'a': 0.5});
};


// Bomb ------------------------------------------------------------------------
var ActorBomb = Client.createActorType('bomb', 8);
ActorBomb.onCreate = function(data, complete) {
    this.id = data[0];
    this.radius = data[1];
    if (complete) {
        this.$.playSound('launchBig');
    }
};

ActorBomb.onDestroy = function(complete) {
    if (complete) {
        this.$.playSound('explosionBig');
        
        var col = this.$.playerColor(this.id);
        this.$.effectArea(this.x, this.y, {'s': this.radius, 'd': 1, 'c': col});
        this.$.effectRing(this.x, this.y, this.radius / 2 * 0.975,
                          {'n': 75, 'd': 1, 's': 1.25, 'c': col, 'a': 1});
        
        this.$.effectArea(this.x, this.y,
                          {'s': this.radius / 2, 'd': 1.5, 'c': col});
        
        this.$.effectRing(this.x, this.y, this.radius * 0.975, 
                          {'n': 125, 'd': 1, 's': 1.25, 'c': col, 'a': 1});
    }
};

ActorBomb.onInterleave = function(diff) {
    this.$.wrapPosition(this);
};

ActorBomb.onDraw = function() {
    var col = this.$.playerColor(this.id);
    this.$.fillCircle(this.x, this.y, 3, col);
    this.$.strokeCircle(this.x, this.y, 6, 1.5, col);
    
    var r = Math.atan2(this.mx, this.my);
    var ox = this.x - Math.sin(r) * 2;
    var oy = this.y - Math.cos(r) * 2;
    
    var rr = [-0.7, -0.35, -0.15, 0.15, 0.35, 0.7];
    this.$.effectParticle(ox, oy,
              this.$.wrapAngle(r - rr[Math.floor(Math.random() * 6)] * 1.15),
              {'s': 1.25, 'd': 0.3, 'c': col, 'a': 1});
    
    this.$.effectParticle(ox, oy,
              this.$.wrapAngle(r - rr[Math.floor(Math.random() * 6)] * 1.5),
              {'s': 1.125, 'd': 0.4, 'c': col, 'a': 1});
};

// PowerUP ---------------------------------------------------------------------
var ActorPowerUp = Client.createActorType('powerup', 0);
ActorPowerUp.onCreate = function(data, complete) {
    this.type = data[0];
    this.col = this.$.powerUpColors[this.type];
    
    if (complete) {
        this.createTime = this.$.getTime();
        this.$.effectExplosion(this.x, this.y, 8, {'d': 1, 's': 0.5, 'c': this.col});
        this.$.playSound('powerSound');
    
    } else {
        this.createTime = this.$.getTime() - 1000;
    }
};

ActorPowerUp.onDestroy = function(complete) {
    if (complete) {
        this.$.effectExplosion(this.x, this.y, 8, {'d': 1, 's': 0.5, 'c': this.col});
        this.$.effectArea(this.x, this.y, {'s': 8, 'd': 0.3, 'c': this.col});
        this.$.playSound('powerSound');
    }
};

ActorPowerUp.onDraw = function() {
    this.$.bg.save();
    this.$.bg.translate(this.x, this.y);
    var scale = this.$.timeScale(this.createTime, 1000);
    if (scale != 1) {
        this.$.bg.scale(scale, scale);
    }
    
    var col = this.$.powerUpColors[this.type];
    if (this.type != 'camu') {
        this.$.fillCircle(0, 0, 5.25, col);
    
    } else {
        this.$.strokeCircle(0, 0, 4.8, 1.5, col);
    }
    this.$.strokeCircle(0, 0, 8, 1, col);
    this.$.bg.restore();
};


// Player Defender -------------------------------------------------------------
var ActorPlayerDef = Client.createActorType('player_def', 8);
ActorPlayerDef.onCreate = function(data, complete) {
    this.id = data[0];
    this.r = data[1];
    this.mr = data[2];
    this.x = data[3];
    this.y = data[4];
    this.wrap();
    
    this.col = this.$.playerColor(this.id);
    if (complete) {
        this.$.effectExplosion(this.dx, this.dy, 4,
                              {'d': 0.25, 's': 1, 'c': this.col});
    }
};

ActorPlayerDef.onDestroy = function(complete) {
    if (complete) {
        this.$.playSound('explosionMedium');
        this.$.effectExplosion(this.dx, this.dy, 6,
                               {'d': 0.5, 's': 1, 'c': this.col});
    }
};

ActorPlayerDef.onDraw = function() {
    this.$.fillCircle(this.dx, this.dy, 5, this.$.playerColor(this.id));
};

ActorPlayerDef.onUpdate = function(data) {
    this.r = data[0];
    this.x = data[1];
    this.y = data[2];
};

ActorPlayerDef.onInterleave = function(step) {
    this.r = this.$.wrapAngle(this.r + this.mr / step);
    this.wrap();
};

ActorPlayerDef.wrap = function() {
    this.dx = this.x + Math.sin(this.r) * 35;
    this.dy = this.y + Math.cos(this.r) * 35;
    if (this.dx < -16) {
        this.dx += this.$.width + 32;
    
    } else if (this.dx > this.$.width + 16) {
        this.dx -= this.$.width + 32;
    }
    
    if (this.dy < -16) {
        this.dy += this.$.height + 32;
    
    } else if (this.dy > this.$.height + 16) {
        this.dy -= this.$.height + 32;
    }
};

