$(function() {
  var $score = $(".score"),
      $bird = $(".bird"),
      $pipes = $(".pipes"),
      $win = $(".window"),
      $wpr = $(".wrapper"),
      $gameOver = $(".gameOver"),
      $new = $gameOver.find(".new"),
      $total = $gameOver.find(".total"),
      $best = $gameOver.find(".best"),
      pipesDuration = 90000, //seconds
      isGameOver = false,
      $up = $(".up"),
      $down = $(".down"),
      min = -135, //pipes pulled up limit
      max = 85, //pipes pushed down limit
      score = 0,
      firstPipePassed = false,
      pipesPos,
      scoreTimer,
      checkTimer,
      pipesVgap = 90;

  //start playing
  $(".play").click(function(e) {
    e.preventDefault();
    controlBirdy();
    $(".start").fadeOut("slow", function() {
      $(".ready")
        .fadeIn("fast")
        .delay(2000)
        .fadeOut("fast", function() {
        gameStart();
      });
    });
  });

  //auto play
  if (window.location.href.indexOf("play=true") != -1) {
    $(".play").click();
  }

  //play again
  $(".playAgain").click(function(e) {
    e.preventDefault();
    window.location.href =
      window.location.href.replace("?play=true", "") + "?play=true";
  });

  function rnd() {
    return parseInt(Math.random() * (max - min) + min, 10);
  }

  function gameOver() {
    isGameOver = true;
    $bird.addClass("birdDies").animate(
      {
        top: 417
      },
      800
    );
    $win
      .add($pipes)
      .add($bird)
      .css("animation-play-state", "paused");
    clearTimeout(checkTimer);
    clearTimeout(scoreTimer);

    //show game over info
    function newScore() {
      $new
        .show()
        .fadeOut(500)
        .delay(500)
        .fadeIn(500);
      $best.html(score);
      createCookie("hs", score, 100);
    }

    $gameOver
      .fadeIn("fast")
      .find(".total")
      .html(score);

    var i = 0;
    var myScoreTimer = setInterval(function() {
      if (i > score) return clearTimeout(myScoreTimer);
      $gameOver.find(".total").html(i);
      i++;
    }, 50);

    //check if its high score
    var hs = readCookie("hs");
    if (typeof hs == "undefined" || hs == "" || hs === null) {
      //console.log('no cookie found, making one');
      newScore();
    } else {
      //console.log('cookie found: ' + hs);
      hs = parseInt(hs, 10);
      if (score > hs) {
        newScore();
      } else {
        $best.html(hs);
      }
    }
  }

  function createCookie(name, value, days) {
    if (days) {
      var date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      var expires = "; expires=" + date.toGMTString();
    } else var expires = "";
    document.cookie = name + "=" + value + expires + "; path=/";
  }

  function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(";");
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == " ") c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  function eraseCookie(name) {
    createCookie(name, "", -1);
  }

  function preparePipes() {
    $pipes
      .css("animation-duration", pipesDuration + "s")
      .addClass("animatePipes");
    $(".gap").height(pipesVgap);
  }

  function arrangePipes() {
    var i = 1,
        startingWidth = 60,
        wprPos,
        wprWidth = $pipes
    .find(".pipesWpr:first")
    .css("margin-top", rnd())
    .outerWidth(true);

    //random position of pipes
    $pipes.find(".pipesWpr:eq(1)").css("margin-top", rnd());
    $pipes.find(".pipesWpr:eq(2)").css("margin-top", rnd());

    //keep checking when first pipe disappear, the append it
    checkTimer = setInterval(function() {
      if ($pipes.position().left < -1 * startingWidth) {
        $pipes.css("padding-left", i * wprWidth);
        startingWidth = startingWidth + wprWidth;
        $pipes
          .find(".pipesWpr:first")
          .css("margin-top", rnd())
          .appendTo($pipes)
          .removeClass("passed");
        i++;
      }

      //score
      wprPos = $('.pipesWpr:not(".passed")').first();

      if (wprPos.offset().left < $bird.offset().left) {
        wprPos.addClass("passed");
        score++;
        $score.html(score);
      }

      //check if collision happened than gameover
      if (checkCollision()) {
        gameOver();
      }
    }, 300);
  }

  function checkCollision() {
    var hits = $bird.collision(".pipe");
    return hits.length == 1;
  }

  function controlBirdy() {
    var topUpLimit = 1,
        top,
        pixelToMove = 10,
        topDownLimit = 421;

    function moveBird(key) {
      if (isGameOver) return;
      if (key != 38) {
        if (key != 40) {
          return;
        }
      }

      top = parseInt($bird.css("top"), 10);

      if (key === 38) {
        if (top > topUpLimit) {
          $bird.css({
            top: top - pixelToMove,
            transform: "rotate(-15deg)"
          });
        }
      } else {
        if (top < topDownLimit) {
          $bird.css({
            top: top + pixelToMove,
            transform: "rotate(15deg)"
          });
        }
      }
    }

    var repeatState = {};
    $(document.body)
      .bind("keydown", function(e) {
      var key = e.which;

      // if no time yet for this key, then start one
      if (!repeatState[key]) {
        // make copy of key code because `e` gets reused
        // by other events in IE so it won't be preserved
        repeatState[key] = setInterval(function() {
          moveBird(key);
        }, 50);
      } else {
        // nothing really to do here
        // The key was pressed, but there is already a timer
        // firing for it
      }
    })
      .bind("keyup", function(e) {
      // if we have a timer for this key, then stop it
      // and delete it from the repeatState object
      var key = e.which;

      var timer = repeatState[key];
      if (timer) {
        clearInterval(timer);
        $bird.css({
          transform: "rotate(0deg)"
        });
        delete repeatState[key];
      }
    });
  }

  function calcScore() {
    var checkTimer = setInterval(function() {
      if ($pipes.position().left < 70) {
        //console.log('PASSED');
        clearTimeout(checkTimer);
        score++;
        $score.html(score);
        scoreTimer = setInterval(function() {
          score++;
          $score.html(score);
        }, 1200);
      }
    }, 1);
  }

  function gameStart() {
    preparePipes();
    arrangePipes();
  }
});

//Collision algo
(function($) {
  function CollisionCoords(proto, containment) {
    if (!proto) {
      this.x1 = this.y1 = this.x2 = this.y2 = 0;
      this.proto = null;
    } else if ("offset" in proto) {
      var d = proto.data("jquery-collision-coordinates");
      if (d) {
        this.x1 = d.x1;
        this.y1 = d.y1;
        this.x2 = d.x2;
        this.y2 = d.y2;
      } else if (containment && containment.length && containment.length >= 4) {
        this.x1 = containment[0];
        this.y1 = containment[1];
        this.x2 = containment[2] + proto.outerWidth(true);
        this.y2 = containment[3] + proto.outerHeight(true);
      } else if (proto.parent().length <= 0) {
        this.x1 = parseInt(proto.css("left")) || 0;
        this.y1 = parseInt(proto.css("top")) || 0;
        this.x2 = parseInt(proto.css("width")) || 0;
        this.y2 = parseInt(proto.css("height")) || 0;
        this.x2 += this.x1;
        this.x2 +=
          (parseInt(proto.css("margin-left")) || 0) +
          (parseInt(proto.css("border-left")) || 0) +
          (parseInt(proto.css("padding-left")) || 0) +
          (parseInt(proto.css("padding-right")) || 0) +
          (parseInt(proto.css("border-right")) || 0) +
          (parseInt(proto.css("margin-right")) || 0);
        this.y2 += this.y1;
        this.y2 +=
          (parseInt(proto.css("margin-top")) || 0) +
          (parseInt(proto.css("border-top")) || 0) +
          (parseInt(proto.css("padding-top")) || 0) +
          (parseInt(proto.css("padding-bottom")) || 0) +
          (parseInt(proto.css("border-bottom")) || 0) +
          (parseInt(proto.css("margin-bottom")) || 0);
      } else {
        var o = proto.offset();
        this.x1 = o.left - (parseInt(proto.css("margin-left")) || 0);
        this.y1 = o.top - (parseInt(proto.css("margin-top")) || 0);
        this.x2 = this.x1 + proto.outerWidth(true);
        this.y2 = this.y1 + proto.outerHeight(true);
      }
      this.proto = proto;
    } else if ("x1" in proto) {
      this.x1 = proto.x1;
      this.y1 = proto.y1;
      this.x2 = proto.x2;
      this.y2 = proto.y2;
      this.proto = proto;
    }
    if ("dir" in proto) {
      this.dir = proto.dir;
    }
  }
  CollisionCoords.prototype.innerContainer = function() {
    var clone = new CollisionCoords(this);
    if (this.proto["css"]) {
      clone.x1 += parseInt(this.proto.css("margin-left")) || 0;
      clone.x1 += parseInt(this.proto.css("border-left")) || 0;
      clone.x1 += parseInt(this.proto.css("padding-left")) || 0;
      clone.x2 -= parseInt(this.proto.css("padding-right")) || 0;
      clone.x2 -= parseInt(this.proto.css("border-right")) || 0;
      clone.x2 -= parseInt(this.proto.css("margin-right")) || 0;
      clone.y1 += parseInt(this.proto.css("margin-top")) || 0;
      clone.y1 += parseInt(this.proto.css("border-top")) || 0;
      clone.y1 += parseInt(this.proto.css("padding-top")) || 0;
      clone.y2 -= parseInt(this.proto.css("padding-bottom")) || 0;
      clone.y2 -= parseInt(this.proto.css("border-bottom")) || 0;
      clone.y2 -= parseInt(this.proto.css("margin-bottom")) || 0;
    }
    return clone;
  };
  CollisionCoords.prototype.move = function(dx, dy) {
    this.x1 += dx;
    this.x2 += dx;
    this.y1 += dy;
    this.y2 += dy;
    return this;
  };
  CollisionCoords.prototype.update = function(obj) {
    if ("x1" in obj) this.x1 = obj["x1"];
    if ("x2" in obj) this.x1 = obj["x2"];
    if ("y1" in obj) this.x1 = obj["y1"];
    if ("y2" in obj) this.x1 = obj["y2"];
    if ("left" in obj) {
      var w = this.x2 - this.x1;
      this.x1 = obj["left"];
      this.x2 = this.x1 + w;
    }
    if ("top" in obj) {
      var h = this.y2 - this.y1;
      this.y1 = obj["top"];
      this.y2 = this.y1 + h;
    }
    if ("offset" in obj) {
      var o = obj.offset();
      this.update(o);
      this.x2 = this.x1 + obj.width();
      this.y2 = this.y1 + obj.height();
    }
    if ("dir" in obj) this.x1 = obj["dir"];
    return this;
  };
  CollisionCoords.prototype.width = function() {
    return this.x2 - this.x1;
  };
  CollisionCoords.prototype.height = function() {
    return this.y2 - this.y1;
  };
  CollisionCoords.prototype.centerx = function() {
    return (this.x1 + this.x2) / 2;
  };
  CollisionCoords.prototype.centery = function() {
    return (this.y1 + this.y2) / 2;
  };
  CollisionCoords.prototype.toString = function() {
    return (
      (this.proto["get"] ? "#" + this.proto.get(0).id : "") +
      "[" +
      [this.x1, this.y1, this.x2, this.y2].join(",") +
      "]"
    );
  };
  CollisionCoords.EPSILON = 0.001;
  CollisionCoords.prototype.containsPoint = function(x, y, inclusive) {
    if (!inclusive) inclusive = false;
    var epsilon = (inclusive ? -1 : +1) * CollisionCoords.EPSILON;
    if (
      x > this.x1 + epsilon &&
      x < this.x2 - epsilon &&
      (y > this.y1 + epsilon && y < this.y2 - epsilon)
    )
      return true;
    else return false;
  };
  CollisionCoords.prototype.overlaps = function(other, inclusive) {
    var hit = this._overlaps(other, inclusive);
    if (hit.length > 0) return hit;
    hit = other._overlaps(this, inclusive);
    if (hit.length > 0) {
      hit[0].dir =
        hit[0].dir == "Inside"
        ? "Outside"
      : hit[0].dir == "Outside"
        ? "Inside"
      : hit[0].dir == "N"
        ? "S"
      : hit[0].dir == "S"
        ? "N"
      : hit[0].dir == "W"
        ? "E"
      : hit[0].dir == "E"
        ? "W"
      : hit[0].dir == "NE"
        ? "SW"
      : hit[0].dir == "SW"
        ? "NE"
      : hit[0].dir == "SE"
        ? "NW"
      : hit[0].dir == "NW" ? "SE" : undefined;
    }
    return hit || [];
  };
  CollisionCoords.prototype._overlaps = function(other, inclusive) {
    var c1 = other;
    var c2 = this;
    if (!inclusive) inclusive = false;
    var ax = c1.centerx();
    var ay = c1.centery();
    var points = [
      [c1.x1, c1.y1, "SE"],
      [c1.x2, c1.y1, "SW"],
      [c1.x2, c1.y2, "NW"],
      [c1.x1, c1.y2, "NE"],
      [ax, c1.y1, "S"],
      [c1.x2, ay, "W"],
      [ax, c1.y2, "N"],
      [c1.x1, ay, "E"],
      [ax, ay, undefined]
    ];
    var hit = null;
    var dirs = {
      NW: false,
      N: false,
      NE: false,
      E: false,
      SE: false,
      S: false,
      SW: false,
      W: false
    };
    for (var i = 0; i < points.length; i++) {
      if (this.containsPoint(points[i][0], points[i][1], inclusive)) {
        if (points[i][2]) dirs[points[i][2]] = true;
        if (hit) continue;
        hit = [
          new CollisionCoords({
            x1: Math.max(c1.x1, c2.x1),
            y1: Math.max(c1.y1, c2.y1),
            x2: Math.min(c1.x2, c2.x2),
            y2: Math.min(c1.y2, c2.y2),
            dir: points[i][2]
          })
        ];
      }
    }
    if (hit) {
      if (dirs["NW"] && dirs["NE"]) hit[0].dir = "N";
      if (dirs["NE"] && dirs["SE"]) hit[0].dir = "E";
      if (dirs["SE"] && dirs["SW"]) hit[0].dir = "S";
      if (dirs["SW"] && dirs["NW"]) hit[0].dir = "W";
      if (dirs["NW"] && dirs["NE"] && dirs["SE"] && dirs["SW"])
        hit[0].dir = "Outside";
      if (
        !dirs["NW"] &&
        !dirs["NE"] &&
        !dirs["SE"] &&
        !dirs["SW"] &&
        !dirs["N"] &&
        !dirs["E"] &&
        !dirs["S"] &&
        !dirs["W"]
      )
        hit[0].dir = "Inside";
    }
    return hit || [];
  };
  CollisionCoords.prototype._protrusion = function(area, dir, list) {
    var o = this.overlaps(new CollisionCoords(area), false);
    if (o.length <= 0) return list;
    o[0].dir = dir;
    list.push(o[0]);
    return list;
  };
  CollisionCoords.prototype.protrusions = function(container) {
    var list = [];
    var n = Number.NEGATIVE_INFINITY;
    var p = Number.POSITIVE_INFINITY;
    var l = container.x1;
    var r = container.x2;
    var t = container.y1;
    var b = container.y2;
    list = this._protrusion(
      {
        x1: l,
        y1: n,
        x2: r,
        y2: t
      },
      "N",
      list
    );
    list = this._protrusion(
      {
        x1: r,
        y1: n,
        x2: p,
        y2: t
      },
      "NE",
      list
    );
    list = this._protrusion(
      {
        x1: r,
        y1: t,
        x2: p,
        y2: b
      },
      "E",
      list
    );
    list = this._protrusion(
      {
        x1: r,
        y1: b,
        x2: p,
        y2: p
      },
      "SE",
      list
    );
    list = this._protrusion(
      {
        x1: l,
        y1: b,
        x2: r,
        y2: p
      },
      "S",
      list
    );
    list = this._protrusion(
      {
        x1: n,
        y1: b,
        x2: l,
        y2: p
      },
      "SW",
      list
    );
    list = this._protrusion(
      {
        x1: n,
        y1: t,
        x2: l,
        y2: b
      },
      "W",
      list
    );
    list = this._protrusion(
      {
        x1: n,
        y1: n,
        x2: l,
        y2: t
      },
      "NW",
      list
    );
    return list;
  };

  function Collision(targetNode, obstacleNode, overlapCoords, overlapType) {
    this.target = targetNode;
    this.obstacle = obstacleNode;
    this.overlap = overlapCoords;
    this.overlapType = overlapType;
  }
  Collision.prototype.distance = function(other) {
    var tc = c.target;
    var oc = c.overlap;
    return Math.sqrt(
      (tc.centerx() - oc.centerx()) * (tc.centerx() - oc.centerx()) +
      (tc.centery() - oc.centery()) * (tc.centery() - oc.centery())
    );
  };

  function CollisionFactory(targets, obstacles, containment) {
    this.targets = targets;
    this.obstacles = obstacles;
    this.collisions = null;
    this.cache = null;
    if (containment) this.containment = containment;
    else this.containment = null;
  }
  CollisionFactory.prototype.getCollisions = function(overlapType) {
    if (this.collisions !== null) return this.collisions;
    this.cache = {};
    this.collisions = [];
    if (!overlapType) overlapType = "collision";
    if (overlapType != "collision" && overlapType != "protrusion") return [];
    var c = [];
    var t = this.targets;
    var o = this.obstacles;
    for (var ti = 0; ti < t.length; ti++) {
      var tc = t[ti];
      for (var oi = 0; oi < o.length; oi++) {
        var oc = o[oi];
        var ol =
            overlapType == "collision"
        ? tc.overlaps(oc)
        : tc.protrusions(oc.innerContainer());
        for (var oli = 0; oli < ol.length; oli++) {
          c.push(new Collision(t[ti], o[oi], ol[oli], overlapType));
        }
      }
    }
    this.collisions = c;
    return c;
  };

  function makeCoordsArray(j) {
    return $(j)
      .get()
      .map(function(e, i, a) {
      return new CollisionCoords($(e));
    });
  }

  function combineQueries(array) {
    var j = $();
    for (var i = 0; i < array.length; i++) {
      j = j.add(array[i]);
    }
    return j;
  }
  $.fn.collision = function(selector, options) {
    if (!options) options = {};
    var mode = "collision";
    var as = null;
    var cd = null;
    var od = null;
    var dd = null;
    var rel = "body";
    if (options.mode == "protrusion") mode = options.mode;
    if (options.as) as = options.as;
    if (options.colliderData) cd = options.colliderData;
    if (options.obstacleData) od = options.obstacleData;
    if (options.directionData) dd = options.directionData;
    if (options.relative) rel = options.relative;
    var cf = new CollisionFactory(
      makeCoordsArray(this),
      makeCoordsArray(selector)
    );
    var ov = cf.getCollisions(mode);
    var array;
    if (!as)
      array = $.map(ov, function(e, i, a) {
        return e.obstacle.proto;
      });
    else
      array = $.map(ov, function(e, i, a) {
        var xoff = e.overlap.x1;
        var yoff = e.overlap.y1;
        if (rel && rel != "body") {
          var r =
              rel == "collider"
          ? $(e.target.proto)
          : rel == "obstacle" ? $(e.obstacle.proto) : $(rel);
          if (r.length > 0) {
            var roff = r.offset();
            xoff -= roff.left;
            yoff -= roff.top;
          }
        }
        var c = $(as)
        .offset({
          left: xoff,
          top: yoff
        })
        .width(e.overlap.width())
        .height(e.overlap.height());
        if (cd) c.data(cd, $(e.target.proto));
        if (od) c.data(od, $(e.obstacle.proto));
        if (dd && e.overlap.dir) c.data(dd, e.overlap.dir);
        return c;
      });
    return combineQueries(array);
  };
})(jQuery);
