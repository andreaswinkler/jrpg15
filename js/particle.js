/* Based on Parcycle by Mr Speaker - www.mrspeaker.net */

// particle
// [x, y, dx, dy, size, sizesmall, ttl, color, drawColor, deltaColor, sharpness]

// particle emitter
function ParticleEmitter() {

    this.maxParticles = 300;
    this.particles = [];
    this.active = true;
    
    this.position = [[50, 50], [1, 1]];
    this.size = [45, 15];
    this.speed = [2.5, 1];
    this.ttl = [9, 7];
    this.angle = [0, 360];
    this.gravity = [0.4, 0.2];
    this.startColor = [[250, 218, 68, 1], [62, 60, 60, 0]];
    this.endColor = [[245, 35, 0, 0], [60, 60, 60, 0]];
    this.sharpness = [40, 10];
    
    this.elapsedTime = 0;
    this.duration = -1;
    this.emissionRate = 0;
    this.emitCounter = 0;
    this.particleIndex = 0;
    
    this.renderTime = 0;
    this.updateTime = 0;
    
    this.init = function() {
        
        this.emissionRate = 1 / (this.maxParticles / this.ttl[0]);
        this.emitCounter = 0;
    
    };
    
    this.rand = function() {
    
        return Math.random() * 2 - 1;
    
    };
    
    this.val = function(key) {
    
        return this[key][0] + (this[key][1] * this.rand());
    
    };
    
    this.valA = function(key) {
    
        var r = [], 
            i;
        
        for (i = 0; i < this[key][0].length; i++) {
        
            r.push(this[key][0][i] + (this[key][1][i] * this.rand()));
        
        }
        
        return r;
    
    };
    
    this.add = function() {
    
        var size, sharpness, angle, speed, startColor, endColor, ttl;
    
        if (this.particles.length < this.maxParticles) {
        
            size = ~~Math.max(0, this.val('size'));
            sharpness = Math.max(0, Math.min(100, this.val('sharpness')));
            angle = this.val('angle') * Math.PI / 180; 
            speed = this.val('speed'), 
            startColor = this.valA('startColor'), 
            endColor = this.valA('endColor');
            ttl = this.val('ttl');

            this.particles.push([
                this.position[0][0] + this.position[1][0] * this.rand(), 
                this.position[0][1] + this.position[1][1] * this.rand(), 
                Math.cos(angle) * speed,  
                Math.sin(angle) * speed, 
                size,
                size / 200 * sharpness, 
                ttl, 
                startColor, 
                'rgba(0,0,0,0)',
                [
                    (endColor[0] - startColor[0]) / ttl, 
                    (endColor[1] - startColor[1]) / ttl, 
                    (endColor[2] - startColor[2]) / ttl, 
                    (endColor[3] - startColor[3]) / ttl
                ],
                sharpness 
            ]);    
        
        }
    
    };
    
    this.render = function(ctx) {
    
        var i, rg, x, y, hs, ts = +new Date();
        
        for (i = 0; i < this.particles.length; i++) {
        
            x = ~~this.particles[i][0];
            y = ~~this.particles[i][1];
            hs = this.particles[i][4] >> 1;
        
            rg = ctx.createRadialGradient(
                x + hs, 
                y + hs, 
                this.particles[i][5], 
                x + hs, 
                y + hs, 
                hs
            );
            rg.addColorStop(0, this.particles[i][8]);
            rg.addColorStop(1, 'rgba(0,0,0,0)');
            
            ctx.fillStyle = rg;
            ctx.fillRect(x, y, this.particles[i][4], this.particles[i][4]);    
        
        }
        
        this.renderTime = +new Date() - ts;
    
    };
    
    this.emit = function(delta) {
    
        this.emitCounter 
    
    };
    
    this.stop = function() {
    
        this.active = false;
    
    };
    
    this.update = function(delta) {
    
        var i, ts = +new Date();
    
        if (this.active) {
        
            this.emitCounter += delta;
            
            while (this.particles.length < this.maxParticles && this.emitCounter > this.emissionRate) {
            
                this.add();
                this.emitCounter -= this.emissionRate;
            
            }
            
            this.elapsedTime += delta;
            
            if (this.duration != -1 && this.duration < this.elapsedTime) {
            
                this.stop();
            
            }   
        
        }
        
        for (i = 0; i < this.particles.length; i++) {
        
            if (this.particles[i][6] > 0) {
            
                // update direction
                this.particles[i][2] += this.gravity[0];
                this.particles[i][3] += this.gravity[1];
                
                // update position
                this.particles[i][0] += this.particles[i][2];
                this.particles[i][1] += this.particles[i][3];
                
                // update ttl
                this.particles[i][6] -= delta;
                
                // update colors
                this.particles[i][8] = 'rgba(' + (~~Math.max(0, Math.min(255, this.particles[i][7][0] += (this.particles[i][9][0] * delta)))) + ',' + 
                                                 (~~Math.max(0, Math.min(255, this.particles[i][7][1] += (this.particles[i][9][1] * delta)))) + ',' + 
                                                 (~~Math.max(0, Math.min(255, this.particles[i][7][2] += (this.particles[i][9][2] * delta)))) + ',' + 
                                                 (Math.max(0, Math.min(255, this.particles[i][7][3] += (this.particles[i][9][3] * delta))).toFixed(2)) + ')'; 
                
                
            } else {
            
                this.particles.splice(i, 1);
                i--;
            
            }
        
        }
        
        this.updateTime = +new Date() - ts;
    
    };

}