﻿function loadAsyncFunctionJSON(path, success, beforeSend, error) {
    $.ajax({
        'async': true,
        'url': path,
        'dataType': 'json',
        'beforeSend': function () {
            if (beforeSend !== undefined) {
                if (beforeSend != null) {
                    beforeSend();
                }
            }
        },
        'success': function (data) {
            success(data);
        },
        'error': function (xhr) {
            if (error !== undefined) {
                if (error != null) {
                    error(xhr);
                }
            }
        }
    });
}

class MoveParser {
    constructor(name, base_damage, angle, bkb, kbg, hitbox_start, hitbox_end, faf) {
        this.name = name;
        this.angle = angle;
        this.faf = faf;

        this.base_damage = base_damage;
        this.bkb = bkb;
        this.kbg = kbg;
        this.hitbox_start = hitbox_start;
        this.hitbox_end = hitbox_end;
        
        this.count = 1;
        this.moves = [];
        var set_kb = false;

        var damage = [];
        var angles = [];
        var kbgs = [];
        var bkbs = [];
        var fkbs = [];

        if (this.base_damage !== undefined && this.bkb !== undefined && this.kbg !== undefined && this.angle !== undefined) {
            if (this.base_damage == "-" || this.base_damage == "" || this.base_damage == "?") {
                this.base_damage = "";
            }
            if (this.angle == "-" || this.angle == "" || this.angle == "?") {
                this.angle = "";
            }
            if (this.bkb == "-" || this.bkb == "" || this.bkb == "?") {
                this.bkb = "";
            }
            if (this.kbg == "-" || this.kbg == "" || this.kbg == "?") {
                this.kbg = "";
            }
            if (this.base_damage.includes("/") || this.bkb.includes("/") || this.kbg.includes("/") || this.angle.includes("/")) {
                //multiple hitboxes
                var first_fkb = false;
                damage = this.base_damage.split("/");
                angles = this.angle.split("/");
                kbgs = this.kbg.split("/");
                if (this.bkb.includes("W: ") && this.bkb.includes("B: ")) {
                    this.bkb = this.bkb.replace("/W:", "W:").replace("/B:", "B:").split(",").join("");
                    var w = this.bkb.split("W:");
                    if (w[1].includes("B:")) {
                        var b = w[1].split("B:")[1];
                        w = w[1].split("B:")[0];
                        fkbs = w.trim().split("/");
                        bkbs = b.trim().split("/");
                        first_fkb = true;
                    } else {
                        var b = this.bkb.split("B:")[1];
                        w = b.split("W:")[1];
                        b = b.trim().split("W:")[0];
                        fkbs = w.trim().split("/");
                        bkbs = b.trim().split("/");
                    }
                } else {
                    if (this.bkb.includes("W: ")) {
                        fkbs = this.bkb.replace("W:", "").trim().split("/");
                        first_fkb = true;
                    } else {
                        bkbs = this.bkb.split("/");
                    }
                }

                var hitbox_count = Math.max(damage.length, angles.length, kbgs.length, (fkbs.length + bkbs.length));
                var set_count = 0;
                var base_count = 0;
                for (var i = 0; i < hitbox_count; i++) {
                    var hitbox_name = this.name + " (Hitbox " + (i + 1) + ")";
                    var d = i < damage.length ? damage[i] : damage[damage.length - 1];
                    var a = i < angles.length ? angles[i] : angles[angles.length - 1];
                    var k = i < kbgs.length ? kbgs[i] : kbgs[kbgs.length - 1];
                    var b = 0;
                    if (first_fkb) {
                        if (set_count < fkbs.length) {
                            b = fkbs[set_count];
                            set_kb = true;
                            set_count++;
                        } else {
                            if (bkbs.length > 0) {
                                b = bkbs[base_count];
                                set_kb = false;
                                base_count++;
                            } else {
                                b = fkbs[fkbs.length - 1];
                                set_kb = true;
                            }
                        }
                    } else {
                        if (base_count < bkbs.length) {
                            b = bkbs[base_count];
                            set_kb = false;
                            base_count++;
                        } else {
                            if (fkbs.length > 0) {
                                b = fkbs[set_count];
                                set_kb = true;
                                set_count++;
                            } else {
                                b = bkbs[bkbs.length - 1];
                                set_kb = false;
                            }
                        }
                    }
                    this.moves.push(new Move(0, hitbox_name, parseFloat(d), parseFloat(a), parseFloat(b), parseFloat(k), set_kb, 0, 0, 0));
                }
            } else {
                //single hitbox
                if (bkb.includes("W: ")) {
                    set_kb = true;
                    this.bkb = bkb.replace("W: ", "");
                }
                if (this.base_damage == "" && this.angle == "" && this.bkb == "" && this.kbg == "") {

                } else {
                    this.moves.push(new Move(0, this.name, parseFloat(this.base_damage), parseFloat(this.angle), parseFloat(this.bkb), parseFloat(this.kbg), set_kb, 0, 0, 0));
                }
            }

        } else {
            this.moves.push(new Move(0, this.name, 0, parseFloat(this.angle),0,0,false,0,0,0).invalidate());
        }

    }
}

class Move {
    constructor(id, name, base_damage, angle, bkb, kbg, set_kb, hitbox_start, hitbox_end, faf) {
        this.id = id;
        this.name = name;
        this.base_damage = base_damage;
        this.angle = angle;
        this.bkb = bkb;
        this.kbg = kbg;
        this.set_kb = set_kb;
        this.hitbox_start = hitbox_start;
        this.hitbox_end = hitbox_end;
        this.faf = faf;
        this.valid = true;
        this.smash_attack = name.includes("Fsmash") || name.includes("Usmash") || name.includes("Dsmash");
        this.throw = name.includes("Fthrow") || name.includes("Bthrow") || name.includes("Uthrow") || name.includes("Dthrow");
        this.chargeable = name.includes("No Charge") || name.includes("Uncharged");

        this.invalidate = function () {
            this.valid = false;
            return this;
        }

        if (this.throw) {
            this.valid = false;
        }
    }
};

function getMoveset(attacker, $scope) {
    $scope.moveset = [];
    var api_name = attacker.api_name.toLowerCase().replace("and", "").replace("-", "").split(".").join("").split(" ").join("");
    loadAsyncFunctionJSON("http://api.kuroganehammer.com/api/characters/name/" + api_name, function (character) {
        if (character != null) {
            var id = character.id;
            loadAsyncFunctionJSON("http://api.kuroganehammer.com/api/Characters/" + id + "/moves", function (moveset) {
                if (moveset != null) {
                    var moves = [];
                    var count = 1;
                    for (var i = 0; i < moveset.length; i++) {
                        var move = moveset[i];
                        var parser = new MoveParser(move.name, move.baseDamage, move.angle, move.baseKnockBackSetKnockback, move.knockbackGrowth, move.hitboxActive, move.hitboxActive, move.firstActionableFrame);
                        for (var c = 0; c < parser.moves.length; c++) {
                            var m = parser.moves[c];
                            m.id = count;
                            moves.push(m);
                            count++;
                        }
                    }
                    moves.unshift(new Move(0,"Not selected",0,0,0,0,false,0,0,0).invalidate());
                    
                    try{
                        $scope.$apply(function () {
                            $scope.moveset = moves;
                        });
                    } catch (err) {
                        $scope.moveset = moves;
                    }
                } else {
                    $scope.moveset = [new Move(0, "Couldn't get attacks", 0, 0, 0, 0, false, 0, 0, 1).invalidate()];
                }
            },
            function () {
                //$scope.moveset = [new Move(0, "Loading...", 0, 0, 0, 0, false, 0, 0, 1).invalidate()];
            }, function () {
                $scope.moveset = [new Move(0, "Couldn't get attacks", 0, 0, 0, 0, false, 0, 0, 1).invalidate()];
            });
        } else {
            $scope.moveset = [new Move(0, "Couldn't access API", 0, 0, 0, 0, false, 0, 0, 1).invalidate()];
        }
    }, function () {
        $scope.moveset = [new Move(0, "Loading...", 0, 0, 0, 0, false, 0, 0, 1).invalidate()];
    }, function () {
        $scope.moveset = [new Move(0, "Couldn't access API", 0, 0, 0, 0, false, 0, 0, 1).invalidate()];
    });
    
}