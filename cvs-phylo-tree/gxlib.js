//  ----------------------------------------------------------------------------
//  gxlib.js
//  ----------------------------------------------------------------------------
//  Purpose:
//    General purpose objects for colour and geometry manipulation
//
//  Dependencies:
//    none
//
//  Author:
//    Paavo Jumppanen
//
//  Copyright (C) 2017-2021,
//  CSIRO Marine and Atmospheric Research
//
//  This file is part of TreeHeatMapViewer.
//
//  TreeHeatMapViewer is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  TreeHeatMapViewer is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with TreeHeatMapViewer.  If not, see <https://www.gnu.org/licenses/>.
//
//  ----------------------------------------------------------------------------


//-------------
// HLS class
//-------------
function gxHLS(nh, nl, ns)
{
  HLS = function(nh, nl, ns)
  {
    this.class = gxHLS;
    this.init(nh, nl, ns);
  };

  //-------------

  HLS.prototype.copy = function()
  {
    return new HLS(this.h,this.l,this.s);
  };

  //-------------

  HLS.prototype.init = function(nh, nl, ns)
  {
    this.h = nh;
    this.l = nl;
    this.s = ns;

    return this;
  };

  //-------------

  HLS.prototype.toRGB = function()
  {
    var dR;
    var dG;
    var dB;
    var dH = this.h;
    var dL = this.l / 256.0;
    var dS = this.s / 256.0;

    if (dS === 0)
    {
      dR = parseInt(255 * dL, 10);
      dG = parseInt(255 * dL, 10);
      dB = parseInt(255 * dL, 10);
    }
    else
    {
      var t1;
      var t2;
      var t3R;
      var t3G;
      var t3B;
      var Hk;

      if (dL < 0.5)
      {
        t2 = dL * (1 + dS);
      }
      else
      {
        t2 = dL + dS - (dL * dS);
      }

      t1  = 2 * dL - t2;
      Hk  = (dH % 360) / 360.0;
      t3R = Hk + (1.0 / 3.0);
      t3G = Hk;
      t3B = Hk - (1.0 / 3.0);
      t3R = (t3R < 0.0) ? t3R + 1.0 : ((t3R > 1.0) ? t3R - 1.0 : t3R);
      t3G = (t3G < 0.0) ? t3G + 1.0 : ((t3G > 1.0) ? t3G - 1.0 : t3G);
      t3B = (t3B < 0.0) ? t3B + 1.0 : ((t3B > 1.0) ? t3B - 1.0 : t3B);
      dR  = (t3R < (1.0 / 6.0)) ? t1 + ((t2 - t1) * 6.0 * t3R) : ((t3R < 0.5) ? t2 : ((t3R < (2.0 / 3.0)) ? t1 + ((t2 - t1) * ((2.0 / 3.0) - t3R) * 6.0) : t1));
      dG  = (t3G < (1.0 / 6.0)) ? t1 + ((t2 - t1) * 6.0 * t3G) : ((t3G < 0.5) ? t2 : ((t3G < (2.0 / 3.0)) ? t1 + ((t2 - t1) * ((2.0 / 3.0) - t3G) * 6.0) : t1));
      dB  = (t3B < (1.0 / 6.0)) ? t1 + ((t2 - t1) * 6.0 * t3B) : ((t3B < 0.5) ? t2 : ((t3B < (2.0 / 3.0)) ? t1 + ((t2 - t1) * ((2.0 / 3.0) - t3B) * 6.0) : t1));

      dR  = parseInt(255 * dR, 10);
      dG  = parseInt(255 * dG, 10);
      dB  = parseInt(255 * dB, 10);
    }

    return gxRGBA(dR,dG,dB, 1.0);
  }

  return new HLS(nh,nl,ns);
};


//-------------
// RGB class
//-------------
function gxRGBA(nr, ng, nb, na)
{
  RGBA = function(nr, ng, nb, na)
  {
    this.class = gxRGBA;
    this.init(nr, ng, nb, na);
  };

  //-------------

  RGBA.prototype.copy = function()
  {
    return new RGBA(this.r,this.g,this.b, this.a);
  };

  //-------------

  RGBA.prototype.init = function(nr, ng, nb, na)
  {
    if ((ng != undefined) && (nb != undefined))
    {
      this.r = nr;
      this.g = ng;
      this.b = nb;
      this.a = na;
    }
    else
    {
      var cvs, ctx;

      // Use canvas to guarantee conversion of colour to RGB representation
      cvs           = document.createElement('canvas');
      cvs.height    = 1;
      cvs.width     = 1;
      ctx           = cvs.getContext('2d');
      ctx.fillStyle = nr;

      ctx.fillRect(0, 0, 1, 1);

      var image_data = ctx.getImageData(0, 0, 1, 1).data;

      this.r = image_data[0];
      this.g = image_data[1];
      this.b = image_data[2];
      this.a = 0.0039215686274509803921568627451 * image_data[3]; // * 1.0 / 255
    }

    return this;
  };

  //-------------

  RGBA.prototype.toHLS = function()
  {
    var nMax;
    var nMin;
    var nH;
    var nS;
    var nL;
    var nR = this.r;
    var nG = this.g;
    var nB = this.b;

    nMax = nR > nG ? nR : nG;
    nMax = nMax > nB ? nMax : nB;
    nMin = nR < nG ? nR : nG;
    nMin = nMin < nB ? nMin : nB;
    nL   = parseInt((nMax + nMin) / 2, 10);

    if (nMax === nMin)
    {
      nH = -1;
      nS = 0;
    }
    else
    {
      if (nL < 128)
      {
        nS = parseInt(255.0 * (nMax - nMin) / (nMax + nMin), 10);
      }
      else
      {
        nS = parseInt(255.0 * (nMax - nMin) / (511 - nMax - nMin), 10);
      }

      var nD = nMax - nMin;

      if (nR === nMax)
      {
        nH = (nG - nB) / nD;
      }
      else if (nG === nMax)
      {
        nH = 2.0 + (nB - nR) / nD;
      }
      else if (nB === nMax)
      {
        nH = 4.0 + (nR - nG) / nD;
      }

      nH *= 60;

      if (nH < 0.0)
      {
        nH += 360.0;
      }
    }

    return gxHLS(nH,nL,nS);
  }

  //-------------

  RGBA.prototype.toString = function()
  {
    var col = 'rgba(' + this.r.toString() + ',' + this.g.toString() + ',' + this.b.toString() + ',' + this.a.toString() + ')';

    return col;
  }

  return new RGBA(nr,ng,nb,na);
}


//-------------
// gxColourMap class
//-------------
function gxColourMap(rmin_colour, rmax_colour, rmin, rmax)
{
  ColourMap = function(rmin_colour, rmax_colour, rmin, rmax)
  {
    var min_colour  = gxRGBA(rmin_colour);
    var max_colour  = gxRGBA(rmax_colour);
    var min_hls     = min_colour.toHLS();
    var max_hls     = max_colour.toHLS();
    var max         = 0;
    var min         = 0;

    if (rmax > rmin)
    {
      max = rmax;
      min = rmin;
    }
    else
    {
      max = rmin;
      min = rmax;
    }

    this.map = function(value)
    {
      var col = undefined;

      if (value < min)
      {
        col = min_colour;
      }
      else if (value > max)
      {
        col = max_colour;
      }
      else
      {
        var fraction   = (value - rmin) / (rmax - rmin);
        var hue        = min_hls.h + (max_hls.h - min_hls.h) * fraction;
        var lightness  = min_hls.l + (max_hls.l - min_hls.l) * fraction;
        var saturation = min_hls.s + (max_hls.s - min_hls.s) * fraction;
        var opacity    = min_colour.a + (max_colour.a - min_colour.a) * fraction;

        col   = gxHLS(hue, lightness, saturation).toRGB();
        col.a = opacity;
      }

      var str_col = col.toString();

      return (str_col);
    };
  };

  var Obj = new ColourMap(rmin_colour, rmax_colour, rmin, rmax);

  return (Obj);
}


//-------------
// gxSegmentedColourMap class
//-------------
function gxSegmentedColourMap(rmap_definition, rlogarithmic=false)
{
  // map_definition is an array of arrays organised in a 3 column by n rows
  // arrangement. Each column contains 3 entries corresponding to:
  //
  // boundary limit
  // colour
  // blend
  //
  // Input values greater than boundary limit map the colour to the colour
  // value provided it is below successive boundary limits. blend is a boolean
  // which when true means the colour should be proportionately interpolated
  // between the boundary limit and the successive one. The upper colour in the
  // interpolation comes from the successive one. For the first boundary limit
  // values below the limit will map to its colour. The logarithmic flag
  // specifies whether to treat the interpolation logarithmically or not. For
  // that to be true the boundary limits must be stricktly positive. Rows
  // must be ordered with ascending boundary limits. If this is not the case
  // an exception will be thrown.
  //
  // Simple example:
  //
  // map_definition = [[0.0, #000000, true],[1.0, #FF00FF, false]]
  //
  SegmentedColourMap = function(rmap_definition, rlogarithmic)
  {
    var map_definition = undefined;
    var logarithmic    = false;
    var ncount         = 0;

    this.initialise = function(rmap_definition, rlogarithmic)
    {
      map_definition = rmap_definition;
      logarithmic    = rlogarithmic;
      ncount         = rmap_definition.length;

      if (ncount < 2)
      {
        throw 'map_definition must have at least 2 rows';
      }

      for (var cn = 0 ; cn < ncount ; cn++)
      {
        if (rmap_definition[cn].length !== 3)
        {
          throw 'map_definition rows must be 3 element arrays';
        }

        if ((cn != 0) && (rmap_definition[cn][0] <= rmap_definition[cn - 1][0]))
        {
          throw 'map_definition boundary limits must be strictly ascending';
        }

        if (logarithmic && (rmap_definition[cn][0] <= 0))
        {
          throw 'map_definition boundary limits must be strictly positive for logaritmic maps';
        }
      }
    };

    this.map = function(value)
    {
      var col = undefined;

      if (value <= map_definition[0][0])
      {
        col = map_definition[0][1];
      }
      else if (value >= map_definition[ncount - 1][0])
      {
        col = map_definition[ncount - 1][1];
      }
      else
      {
        var nwhich = undefined;

        for (var cn = 0 ; cn < ncount ; cn++)
        {
          if (value >= map_definition[cn][0])
          {
            nwhich = cn;
          }
          else if (nwhich !== undefined)
          {
            break;
          }
        }

        if (map_definition[nwhich][2])
        {
          var min_colour  = gxRGBA(map_definition[nwhich][1]);
          var max_colour  = gxRGBA(map_definition[nwhich + 1][1]);
          var min_hls     = min_colour.toHLS();
          var max_hls     = max_colour.toHLS();
          var max         = map_definition[nwhich + 1][0];
          var min         = map_definition[nwhich][0];

          if (logarithmic)
          {
            max   = Math.log(max);
            min   = Math.log(min);
            value = Math.log(value);
          }

          var fraction   = (value - min) / (max - min);
          var hue        = min_hls.h + (max_hls.h - min_hls.h) * fraction;
          var lightness  = min_hls.l + (max_hls.l - min_hls.l) * fraction;
          var saturation = min_hls.s + (max_hls.s - min_hls.s) * fraction;
          var opacity    = min_colour.a + (max_colour.a - min_colour.a) * fraction;
          var rgba       = gxHLS(hue, lightness, saturation).toRGB();

          rgba.a = opacity;
          col    = rgba.toString();
        }
        else
        {
          col = map_definition[nwhich][1];
        }
      }

      return (col);
    };

    this.minimum = function()
    {
      return (map_definition[0][0]);
    };

    this.maximum = function()
    {
      return (map_definition[map_definition.length - 1][0]);
    };

    this.mapDefinition = function()
    {
      var duplicate = map_definition.map(function(val)
                                         {
                                           return val.slice(0)
                                         });

      return duplicate;
    };

    this.initialise(rmap_definition, rlogarithmic);
  }

  var Obj = new SegmentedColourMap(rmap_definition, rlogarithmic);

  return (Obj);
}


//-------------
// Pt class
//-------------
function gxPt(nX,nY,nZ,bExact)
{
  Pt = function(nX,nY,nZ,bExact)
  {
    this.class = gxPt;
    this.init(nX,nY,nZ,bExact);
  };

  //-------------

  Pt.prototype.copy = function()
  {
    return new Pt(this.x,this.y,this.z,true);
  };

  //-------------

  Pt.prototype.init = function(nX,nY,nZ,bExact)
  {
    var bNoDefault = bExact || false;

    this.x = bNoDefault ? nX : (nX || 0);
    this.y = bNoDefault ? nY : (nY || 0);
    this.z = nZ;

    return this;
  };

  //-------------

  Pt.prototype.assign = function(Pt)
  {
    this.x = Pt.x;
    this.y = Pt.y;
    this.z = Pt.z;
  };

  //-------------

  Pt.prototype.sign = function()
  {
    var nZ = this.z !== null ? (this.z >= 0 ? 1 : -1) : null;

    return new Pt(this.x >= 0 ? 1 : -1, this.y >= 0 ? 1 : -1, nZ);
  };

  //-------------

  Pt.prototype.abs = function()
  {
    this.x = Math.abs(this.x);
    this.y = Math.abs(this.y);
    this.z = (this.z !== null ? Math.abs(this.z) : null);

    return this;
  };

  //-------------

  Pt.prototype.round = function()
  {
    this.x = Math.floor(this.x + 0.5);
    this.y = Math.floor(this.y + 0.5);
    this.z = (this.z !== null ? Math.floor(this.z + 0.5) : null);

    return this;
  };

  //-------------

  Pt.prototype.mkNull = function()
  {
    this.x = 0;
    this.y = 0;
    this.z = (this.z !== null ? 0 : null);

    return this;
  };

  //-------------

  Pt.prototype.max = function(rPt)
  {
    return this.copy().maxe(rPt);
  };

  //-------------

  Pt.prototype.maxe = function(rPt)
  {
    this.x = (this.x > rPt.x) ? this.x : rPt.x;
    this.y = (this.y > rPt.y) ? this.y : rPt.y;
    this.z = (this.z !== null ? ((this.z > rPt.z) ? this.z : rPt.z) : null);

    return this;
  };

  //-------------

  Pt.prototype.min = function(rPt)
  {
    return this.copy().mine(rPt);
  };

  //-------------

  Pt.prototype.mine = function(rPt)
  {
    this.x = (this.x < rPt.x) ? this.x : rPt.x;
    this.y = (this.y < rPt.y) ? this.y : rPt.y;
    this.z = (this.z !== null ? ((this.z < rPt.z) ? this.z : rPt.z) : null);

    return this;
  };

  //-------------

  Pt.prototype.minPositive = function(rPt)
  {
    return this.copy().minPositivee(rPt);
  };

  //-------------

  Pt.prototype.minPositivee = function(rPt)
  {
    var mp = function(a,b)
             {
               var r = null;

               if ((a || -1) > 0)
               {
                 if ((b || -1) > 0)
                 {
                   r = (a < b) ? a : b;
                 }
                 else
                 {
                   r = a;
                 }
               }
               else if ((b || -1) > 0)
               {
                 r = b;
               }

               return (r);
             };

    this.x = mp(this.x,rPt.x);
    this.y = mp(this.y,rPt.y);
    this.z = mp(this.z,rPt.z);

    return this;
  };

  //-------------

  Pt.prototype.ne = function(rPt)
  {
    return ((this.x !== rPt.x) || (this.y !== rPt.y) || (this.z !== rPt.z));
  };

  //-------------

  Pt.prototype.mod = function(i)
  {
    return this.copy().mode(i);
  };

  //-------------

  Pt.prototype.mode = function(i)
  {
    this.x = this.x % i;
    this.y = this.y % i;

    if (this.z !== null)
    {
      this.z = this.z;
    }

    return this;
  };

  //-------------

  Pt.prototype.mul = function(i)
  {
    return this.copy().mule(i);
  };

  //-------------

  Pt.prototype.mule = function(i)
  {
    this.x *= i;
    this.y *= i;

    if (this.z !== null)
    {
      this.z *= i;
    }

    return this;
  };

  //-------------

  Pt.prototype.div = function(i)
  {
    return this.copy().dive(i);
  };

  //-------------

  Pt.prototype.dive = function(i)
  {
    this.x /= i;
    this.y /= i;

    if (this.z !== null)
    {
      this.z /= i;
    }

    return this;
  };

  //-------------

  Pt.prototype.add = function(rPt)
  {
    return this.copy().adde(rPt);
  };

  //-------------

  Pt.prototype.adde = function(rPt)
  {
    this.x += rPt.x;
    this.y += rPt.y;

    if ((this.z !== null) && (rPt.z !== null))
    {
      this.z += rPt.z;
    }

    return this;
  };

  //-------------

  Pt.prototype.sub = function(rPt)
  {
    return this.copy().sube(rPt);
  };

  //-------------

  Pt.prototype.sube = function(rPt)
  {
    this.x -= rPt.x;
    this.y -= rPt.y;

    if ((this.z !== null) && (rPt.z !== null))
    {
      this.z -= rPt.z;
    }

    return this;
  };

  //-------------

  Pt.prototype.neg = function()
  {
    this.x = -this.x;
    this.y = -this.y;

    if (this.z !== null)
    {
      this.z = -this.z;
    }

    return this;
  };

  //-------------

  Pt.prototype.negc = function()
  {
    var pt = this.copy();

    pt.neg();

    return pt;
  };

  //-------------

  Pt.prototype.arg = function()
  {
    return this.x * this.x + this.y * this.y;
  };

  //-------------

  Pt.prototype.mag = function()
  {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  };

  //-------------

  Pt.prototype.phase = function()
  {
    var Phase;

    if (this.x !== 0)
    {
      Phase = Math.atan2(this.y, this.x);
    }
    else
    {
      if (this.y >= 0)
      {
        Phase = Math.PI / 2;
      }
      else
      {
        Phase = -Math.PI / 2;
      }
    }

    return Phase;
  };

  //-------------

  Pt.prototype.lt = function(rPt)
  {
    return ((this.x < rPt.x) && (this.y < rPt.y) && ((this.z !== null) ? (rPt.z !== null) && (this.z < rPt.z) : (rPt.z === null)));
  };

  //-------------

  Pt.prototype.le = function(rPt)
  {
    return ((this.x <= rPt.x) && (this.y <= rPt.y) && ((this.z !== null) ? (rPt.z !== null) && (this.z <= rPt.z) : (rPt.z === null)));
  };

  //-------------

  Pt.prototype.eq = function(rPt)
  {
    return ((this.x === rPt.x) && (this.y === rPt.y) && ((this.z !== null) ? (this.z === rPt.z) : (rPt.z === null)));
  };

  //-------------

  Pt.prototype.gt = function(rPt)
  {
    return ((this.x > rPt.x) && (this.y > rPt.y) && ((this.z !== null) ? (rPt.z !== null) && (this.z > rPt.z) : (rPt.z === null)));
  };

  //-------------

  Pt.prototype.ge = function(rPt)
  {
    return ((this.x >= rPt.x) && (this.y >= rPt.y) && ((this.z !== null) ? (rPt.z !== null) && (this.z >= rPt.z) : (rPt.z === null)));
  };

  //-------------

  Pt.prototype.isNull = function()
  {
    return ((this.x === 0) && (this.y === 0) && ((this.z === null) || (this.z === 0)));
  };

  //-------------

  Pt.prototype.isUnity = function()
  {
    return ((this.x === 1) && (this.y === 1) && ((this.z === null) || (this.z === 1)));
  };

  return new Pt(nX,nY,nZ,bExact);
}


//-------------
// Rect class
//-------------
function gxRect(x1,y1,x2,y2)
{
  Rect = function(x1,y1,x2,y2)
  {
    this.class = gxRect;
    this.init(x1,y1,x2,y2);
  };

  //-------------

  Rect.prototype.copy = function()
  {
    return new Rect(this.tl.x,this.tl.y,this.br.x,this.br.y);
  };

  //-------------

  Rect.prototype.init = function(x1,y1,x2,y2)
  {
    if (x1 === undefined)
    {
      this.tl = gxPt();
      this.br = gxPt();
    }
    else if ((x1.class === gxPt) && (y1.class === gxPt))
    {
      this.tl = x1.copy();
      this.br = y1.copy();
    }
    else
    {
      this.tl = gxPt(x1,y1);
      this.br = gxPt(x2,y2);
    }

    return this;
  };

  //-------------

  Rect.prototype.screenExtent = function(obj)
  {
    var parent = obj.offsetParent;
    this.tl.x  = obj.offsetLeft;
    this.tl.y  = obj.offsetTop;

    while (parent !== null)
    {
      this.tl.x += parent.offsetLeft;
      this.tl.y += parent.offsetTop;

      parent = parent.offsetParent;
    }

    this.br.x = this.tl.x + obj.offsetWidth;
    this.br.y = this.tl.y + obj.offsetHeight;
  };

  //-------------

  Rect.prototype.clientExtent = function(obj)
  {
    this.tl.x = 0;
    this.tl.y = 0;
    this.br.x = obj.clientWidth;
    this.br.y = obj.clientHeight;
  };

  //-------------

  Rect.prototype.norm = function(x1,y1,x2,y2)
  {
    var p1  = this.tl.min(this.br);
    var p2  = this.tl.max(this.br);
    this.tl = p1;
    this.br = p2;

    return this;
  };

  //-------------

  Rect.prototype.expand = function(by)
  {
    this.tl.x -= by;
    this.tl.y -= by;
    this.br.x += by;
    this.br.y += by;

    return this;
  };

  //-------------

  Rect.prototype.width = function()
  {
    return (this.br.x - this.tl.x);
  };

  //-------------

  Rect.prototype.height = function()
  {
    return (this.br.y - this.tl.y);
  };

  //-------------

  Rect.prototype.middle = function()
  {
    return gxPt((this.tl.x + this.br.x) * 0.5, (this.tl.y + this.br.y) * 0.5);
  }

  //-------------

  Rect.prototype.tr = function()
  {
    return gxPt(this.br.x, this.tl.y);
  }

  //-------------

  Rect.prototype.bl = function()
  {
    return gxPt(this.tl.x, this.br.y);
  }

  //-------------

  Rect.prototype.contains = function(x, y)
  {
    if (x.class === gxRect)
    {
      return (this.intersect(x) === x);
    }
    else if (x.class === gxPt)
    {
      return (x.x >= this.tl.x &&
              x.x <= this.br.x &&
              x.y >= this.tl.y &&
              x.y <= this.br.y);
    }
    else
    {
      return (x >= this.tl.x &&
              x <= this.br.x &&
              y >= this.tl.y &&
              y <= this.br.y);
    }
  };

  //-------------

  Rect.prototype.intersects = function(rRect)
  {
    return (!this.intersect(rRect).isNull());
  };

  //-------------

  Rect.prototype.isNull = function()
  {
    return (this.tl.x === 0 &&
            this.tl.y === 0 &&
            this.br.x === 0 &&
            this.br.y === 0);
  };

  //-------------

  Rect.prototype.mkNull = function()
  {
    this.tl.mkNull();
    this.br.mkNull();
    return this;
  };

  //-------------

  Rect.prototype.adde = function(rPt)
  {
    this.tl.adde(rPt);
    this.br.adde(rPt);
    return this;
  };

  //-------------

  Rect.prototype.sube = function(rPt)
  {
    this.tl.sube(rPt);
    this.br.sube(rPt);
    return this;
  };

  //-------------

  Rect.prototype.eq = function(rRect)
  {
    return (this.tl.eq(rRect.tl) &&
            this.br.eq(rRect.br));
  };

  //-------------

  Rect.prototype.join = function(rRect)
  {
    var Union;

    if (this.isNull())
    {
      Union = rRect.copy();
    }
    else if (rRect.isNull())
    {
      Union = this.copy();
    }
    else
    {
      var mintl = this.tl.min(rRect.tl);
      var maxbr = this.br.max(rRect.br);
      Union = new Rect(mintl.x,mintl.y,maxbr.x,maxbr.y);

      if (Union.tl.l > Union.br.r ||
          Union.tl.t > Union.br.b ||
          ((Union.width() === 0) && (Union.height() === 0)))
      {
        Union.mkNull();
      }
    }

    return Union;
  };

  //-------------

  Rect.prototype.intersect = function(rRect)
  {
    var maxtl = this.tl.max(rRect.tl);
    var minbr = this.br.min(rRect.br);
    var Isect = new Rect(maxtl.x,maxtl.y,minbr.x,minbr.y);

    if (Isect.tl.l > Isect.br.r ||
        Isect.tl.t > Isect.br.b ||
        ((Isect.width() === 0) && (Isect.height() === 0)))
    {
      Isect.mkNull();
    }

    return Isect;
  };

  //-------------

  Rect.prototype.drawRectangle = function(ctx, solid)
  {
    ctx.beginPath();
    ctx.rect(this.tl.x, this.tl.y, this.width(), this.height());
    ctx.stroke();

    if (solid === true)
    {
      ctx.fill();
    }
  };

  //-------------

  Rect.prototype.drawRoundedRectangle = function(ctx, radius, solid)
  {
    ctx.beginPath();
    ctx.moveTo(this.tl.x + radius, this.tl.y);
    ctx.arcTo(this.br.x, this.tl.y, this.br.x, this.tl.y + radius, radius);
    ctx.arcTo(this.br.x, this.br.y, this.br.x - radius, this.br.y, radius);
    ctx.arcTo(this.tl.x, this.br.y, this.tl.x, this.br.y - radius, radius);
    ctx.arcTo(this.tl.x ,this.tl.y, this.tl.x + radius, this.tl.y, radius);
    ctx.stroke();

    if (solid === true)
    {
      ctx.fill();
    }
  };

  return new Rect(x1,y1,x2,y2);
}


//-------------
// Range class
//-------------
function gxRange(nA, nB)
{
  Range = function(nA,nB)
  {
    this.class = gxRange;
    this.init(nA,nB);
  };

  //-------------

  Range.prototype.copy = function()
  {
    return new Range(this.min,this.max);
  };

  //-------------

  Range.prototype.init = function(nA,nB)
  {
    this.min = nA || 0;
    this.max = nB || 0;

    if (this.min > this.max)
    {
      var t    = this.max;
      this.max = this.min;
      this.min = t;
    }

    return this;
  };

  //-------------

  Range.prototype.limit = function(nV)
  {
    var LV = nV;

    if (LV < this.min)
    {
      LV = this.min;
    }
    else if (LV > this.max)
    {
      LV = this.max;
    }

    return LV;
  };

  //-------------

  Range.prototype.isIn = function(nV)
  {
    return (nV != null ? (nV >= this.min) && (nV <= this.max) : false);
  };

  //-------------

  Range.prototype.isNull = function()
  {
    return (this.max === this.min);
  };

  //-------------

  Range.prototype.mkNull = function()
  {
    this.max = 0;
    this.min = 0;
    return this;
  };

  //-------------

  Range.prototype.add = function(V)
  {
    return this.copy().adde(V);
  };

  //-------------

  Range.prototype.adde = function(V)
  {
    if (V.class === gxRange)
    {
      if (this.min > V.min)
      {
        this.min = V.min;
      }

      if (this.max < V.max)
      {
        this.max = V.max;
      }
    }
    else if (V)
    {
      if (V > this.max)
      {
        this.max = V;
      }
      else if (V < this.min)
      {
        this.min = V;
      }
    }

    return this;
  };

  //-------------

  Range.prototype.length = function()
  {
    return (this.max - this.min);
  };

  return new Range(nA,nB);
}


//-------------
// LineSegment class
//-------------
function gxLineSegment(ptA, ptB)
{
  LineSegment = function(ptA, ptB)
  {
    this.class = gxLineSegment;
    this.init(ptA, ptB);
  };

  //-------------

  LineSegment.prototype.init = function(ptA, ptB)
  {
    if ((ptA.class === gxPt) &&
        (ptB.class === Pt))
    {
      this.A = ptA.copy();
      this.B = ptB.copy();
    }
    else
    {
      this.A = gxPt();
      this.B = gxPt();
    }

    return this;
  };

  //-------------

  LineSegment.prototype.isIn = function(rRect)
  {
    return !this.intersect(rRect).isNull();
  };

  //-------------

  LineSegment.prototype.clip = function(rRect)
  {
    var Rect  = rRect.copy().norm();
    var Res   = {visible:true,clipped_A:false,clipped_B:false};
    var dX    = this.A.x - this.B.x;
    var dY    = this.A.y - this.B.y;

    if (dX > 0)
    {
      if ((this.A.x >= Rect.tl.x) && (this.B.x <= Rect.br.x))
      {
        if (this.A.x > Rect.br.x)
        {
          this.A.y = ((Rect.br.x - this.B.x) * dY / dX) + this.B.y;
          this.A.x = Rect.br.x;
          Res.clipped_A = true;
        }

        if (this.B.x < Rect.tl.x)
        {
          this.B.y = ((Rect.tl.x - this.B.x) * dY / dX) + this.B.y;
          this.B.x = Rect.tl.x;
          Res.clipped_B = true;
        }
      }
      else
      {
        Res.visible = false;
        this.mkNull();
      }
    }
    else if (dX != 0)
    {
      if ((this.B.x >= Rect.tl.x) && (this.A.x <= Rect.br.x))
      {
        if (this.B.x > Rect.br.x)
        {
          this.B.y = ((Rect.br.x - this.A.x) * dY / dX) + this.A.y;
          this.B.x = Rect.br.x;
          Res.clipped_B = true;
        }

        if (this.A.x < Rect.tl.x)
        {
          this.A.y = ((Rect.tl.x - this.A.x) * dY / dX) + this.A.y;
          this.A.x = Rect.tl.x;
          Res.clipped_A = true;
        }
      }
      else
      {
        Res.visible = false;
        this.mkNull();
      }
    }
    else
    {
      if ((this.A.x > Rect.br.x) || (this.A.x < Rect.tl.x))
      {
        Res.visible = false;
        this.mkNull();
      }
    }

    if (Res.visible)
    {
      dX = this.A.x - this.B.x;
      dY = this.A.y - this.B.y;

      if (dY > 0)
      {
        if ((this.A.y >= Rect.tl.y) && (this.B.y <= Rect.br.y))
        {
          if (this.A.y > Rect.br.y)
          {
            this.A.x = ((Rect.br.y - this.B.y) * dX / dY) + this.B.x;
            this.A.y = Rect.br.y;
            Res.clipped_A = true;
          }

          if (this.B.y < Rect.tl.y)
          {
            this.B.x = ((Rect.tl.y - this.B.y) * dX / dY) + this.B.x;
            this.B.y = Rect.tl.y;
            Res.clipped_B = true;
          }
        }
        else
        {
          Res.visible = false;
          this.mkNull();
        }
      }
      else if (dY != 0)
      {
        if ((this.B.y >= Rect.tl.y) && (this.A.y <= Rect.br.y))
        {
          if (this.B.y > Rect.br.y)
          {
            this.B.x = ((Rect.br.y - this.A.y) * dX / dY) + this.A.x;
            this.B.y = Rect.br.y;
            Res.clipped_B = true;
          }

          if (this.A.y < Rect.tl.y)
          {
            this.A.x = ((Rect.tl.y - this.A.y) * dX / dY) + this.A.x;
            this.A.y = Rect.tl.y;
            Res.clipped_A = true;
          }
        }
        else
        {
          Res.visible = false;
          this.mkNull();
        }
      }
      else
      {
        if ((this.A.y > Rect.br.y) || (this.A.y < Rect.tl.y))
        {
          Res.visible = false;
          this.mkNull();
        }
      }
    }

    return Res;
  };

  //-------------

  LineSegment.prototype.intersect = function(rRect)
  {
    var Intersection = this.copy();

    if ((!rRect.contains(this.A)) || (!rRect.contains(this.B)))
    {
      Intersection.clip(rRect);
    }

    return Intersection;
  };

  //-------------

  LineSegment.prototype.length = function()
  {
    var dX = this.A.x - this.B.x;
    var dY = this.A.y - this.B.y;

    return Math.sqrt((dX * dX) + (dY * dY));
  };

  //-------------

  LineSegment.prototype.isNull = function()
  {
    return this.A.eq(this.B);
  };

  //-------------

  LineSegment.prototype.mkNull = function()
  {
    this.A.mkNull();
    this.B.mkNull();
  };

  //-------------

  LineSegment.prototype.copy = function()
  {
    return new LineSegment(this.A, this.B);
  };

  return new LineSegment(ptA, ptB);
}


//-------------
// CoOrdTransformM class
//-------------
function gxCoOrdTransformMatrix(obj)
{
  CoOrdTransformM = function(obj)
  {
    this.class = gxCoOrdTransformMatrix;
    this.reset(obj);
  };

  //-------------

  CoOrdTransformM.prototype.copy = function()
  {
    return new CoOrdTransformM(this);
  };

  //-------------

  CoOrdTransformM.prototype.reset = function(obj)
  {
    if (obj.class === gxCoOrdTransformMatrix)
    {
      this.A = obj.A;
      this.B = obj.B;
      this.C = obj.C;
      this.D = obj.D;
      this.H = obj.H;
      this.K = obj.K;
      this.IsIdentity = obj.IsIdentity;
    }
    else
    {
      this.A = 1;
      this.B = 0;
      this.C = 0;
      this.D = 1;
      this.H = 0;
      this.K = 0;
      this.IsIdentity = true;
    }

    return this;
  };

  //-------------

  CoOrdTransformM.prototype.preMul = function(T)
  {
    if (this.IsIdentity)
    {
      this.A           = T.A;
      this.B           = T.B;
      this.C           = T.C;
      this.D           = T.D;
      this.H           = T.H;
      this.K           = T.K;
      this.IsIdentity  = T.IsIdentity;
    }
    else if (!T.IsIdentity)
    {
      var fA = (T.A * this.A) + (T.B * this.C);
      var fB = (T.A * this.B) + (T.B * this.D);
      var fC = (T.C * this.A) + (T.D * this.C);
      var fD = (T.C * this.B) + (T.D * this.D);
      var fH = (T.H * this.A) + (T.K * this.C) + this.H;
      var fK = (T.H * this.B) + (T.K * this.D) + this.K;

      this.A = fA;
      this.B = fB;
      this.C = fC;
      this.D = fD;
      this.H = fH;
      this.K = fK;
      this.IsIdentity = false;
    }

    return this;
  };

  //-------------

  CoOrdTransformM.prototype.postMul = function(T)
  {
    if (T.IsIdentity)
    {
      this.A = T.A;
      this.B = T.B;
      this.C = T.C;
      this.D = T.D;
      this.H = T.H;
      this.K = T.K;
      this.IsIdentity = T.IsIdentity;
    }
    else if (!T.IsIdentity)
    {
      var fA = (this.A * T.A) + (this.B * T.C);
      var fB = (this.A * T.B) + (this.B * T.D);
      var fC = (this.C * T.A) + (this.D * T.C);
      var fD = (this.C * T.B) + (this.D * T.D);
      var fH = (this.H * T.A) + (this.K * T.C) + T.H;
      var fK = (this.H * T.B) + (this.K * T.D) + T.K;

      this.A = fA;
      this.B = fB;
      this.C = fC;
      this.D = fD;
      this.H = fH;
      this.K = fK;
      this.IsIdentity = false;
    }

    return this;
  };

  //-------------

  CoOrdTransformM.prototype.map = function(Pt)
  {
    return gxPt((this.A * Pt.x) + (this.C * Pt.y) + this.H,
                (this.B * Pt.x) + (this.D * Pt.y) + this.K);
  };

  //-------------

  CoOrdTransformM.prototype.eq = function(T)
  {
    return ((this.A === T.A) &&
            (this.B === T.B) &&
            (this.C === T.C) &&
            (this.D === T.D) &&
            (this.H === T.H) &&
            (this.K === T.K));
  };

  //-------------

  CoOrdTransformM.prototype.ne = function(T)
  {
    return ((this.A !== T.A) ||
            (this.B !== T.B) ||
            (this.C !== T.C) ||
            (this.D !== T.D) ||
            (this.H !== T.H) ||
            (this.K !== T.K));
  };

  return new CoOrdTransformM(this);
}


//-------------
// CoOrdTransform class
//-------------
function gxCoOrdTransform(Pt, InitType)
{
  CoOrdTransform = function(Pt, InitType)
  {
    this.class = gxCoOrdTransform;
    this.M  = gxCoOrdTransformMatrix();
    this.IM = gxCoOrdTransformMatrix();

    if (Pt !== undefined)
    {
      if (Pt.class === gxPt)
      {
        switch(InitType)
        {
          // Translation
          case 0:
            this.M.H  = Pt.x;
            this.M.K  = Pt.y;
            this.IM.H = -Pt.x;
            this.IM.K = -Pt.y;
            break;

          // Scaling
          case 1:
            this.M.A  = Pt.x;
            this.M.D  = Pt.y;
            this.IM.A = 1.0 / Pt.x;
            this.IM.D = 1.0 / Pt.y;
            break;

          // Shearing
          case 2:
            this.M.B  = Pt.x;
            this.M.C  = Pt.y;
            this.IM.B = -Pt.x;
            this.IM.C = -Pt.y;
            break;

          // Rotating
          case 3:
            var CosAngle = Math.cos(Pt.x);
            var SinAngle = Math.sin(Pt.x);

            this.M.A  =  CosAngle;
            this.M.B  =  SinAngle;
            this.M.C  = -SinAngle;
            this.M.D  =  CosAngle;
            this.IM.A =  CosAngle;
            this.IM.B = -SinAngle;
            this.IM.C =  SinAngle;
            this.IM.D =  CosAngle;
            break;

          default:
            break;
        }

        this.M.IsIdentity  = false;
        this.IM.IsIdentity = false;
      }
      else if (Pt.class === gxCoOrdTransform)
      {
        this.M  = Pt.M.copy();
        this.IM = Pt.IM.copy();
      }
    }
  };

  //-------------

  CoOrdTransform.prototype.copy = function()
  {
    return new CoOrdTransform(this);
  };

  //-------------

  CoOrdTransform.prototype.reset = function()
  {
    this.M.reset();
    this.IM.reset();
    return this;
  };

  //-------------

  CoOrdTransform.prototype.init = function(Pt, T)
  {
    var tf = new CoOrdTransform(Pt, T);

    this.M.postMul(tf.M);
    this.IM.preMul(tf.IM);
    return this;
  };

  //-------------

  CoOrdTransform.prototype.translate = function(Pt)
  {
    this.init(Pt, 0);
    return this;
  };

  //-------------

  CoOrdTransform.prototype.scale = function(Pt)
  {
    this.init(Pt, 1);
    return this;
  };

  //-------------

  CoOrdTransform.prototype.shear = function(Pt)
  {
    this.init(Pt, 2);
    return this;
  };

  //-------------

  CoOrdTransform.prototype.rotate = function(Angle)
  {
    if (Angle !== 0)
    {
      this.init(gxPt(Angle,0), 3);
    }

    return this;
  };

  //-------------

  CoOrdTransform.prototype.scaleAboutPt = function(Pt, Scale)
  {
    if ((Scale.x !== 1.0) || (Scale.y !== 1.0))
    {
      this.translate(Pt.negc());
      this.scale(Scale);
      this.translate(Pt);
    }

    return this;
  };

  //-------------

  CoOrdTransform.prototype.rotateAboutPt = function(Pt, Angle)
  {
    if (Angle !== 0)
    {
      this.translate(Pt.negc());
      this.rotate(Angle);
      this.translate(Pt);
    }

    return this;
  };

  //-------------

  CoOrdTransform.prototype.preMul = function(T)
  {
    this.M.preMul(T.M);
    this.IM.postMul(T.IM);

    return this;
  };

  //-------------

  CoOrdTransform.prototype.postMul = function(T)
  {
    this.M.postMul(T.M);
    this.IM.preMul(T.IM);

    return this;
  };

  //-------------

  CoOrdTransform.prototype.inverse = function(T)
  {
    var nT = this.copy();
    var tf = T.M;
    nT.M   = T.IM;
    nT.IM  = tf;

    return nT;
  };

  //-------------

  CoOrdTransform.prototype.map = function(P, Inv)
  {
    if (P.class === gxPt)
    {
      return Inv ? this.IM.map(P) : this.M.map(P);
    }
    else if (P.class === gxRect)
    {
      var p1 = this.map(P.tl);
      var p2 = this.map(P.br);
      var p3 = this.map(P.bl());
      var p4 = this.map(P.tr());
      var Rect = gxRect(p1.min(p2.min(p3.min(p4))), p1.max(p2.max(p3.max(p4))));

      return Rect.norm();
    }
    else
    {
      return Inv ? this.IM.map(gxPt(P)) : this.M.map(gxPt(P));
    }
  };

  //-------------

  CoOrdTransform.prototype.mapAngle = function(A, Inv)
  {
    var Pt1 = gxPt();
    var Pt2 = gxPt();
    var dx;
    var dy;

    Pt2.x = Math.cos(A);
    Pt2.y = Math.sin(A);
    Pt1   = this.map(Pt1, Inv);
    Pt2   = this.map(Pt2, Inv);
    dx    = Pt2.x - Pt1.x;
    dy    = Pt2.y - Pt1.y;

    return (((dy !== 0) || (dx !== 0)) ? Math.atan2(dy, dx) : 0.0);
  };

  //-------------

  CoOrdTransform.prototype.mapMagnitude = function(M, InX, Inv)
  {
    var TM;
    var A = gxPt();
    var B = gxPt();

    if (InX)
    {
      B.x = M;
    }
    else
    {
      B.y = M;
    }

    A = this.map(A, Inv);
    B = this.map(B, Inv);
    B.sube(A);

    if (B.x === 0.0)
    {
      TM = Math.abs(B.y);
    }
    else if (B.y === 0.0)
    {
      TM = Math.abs(B.x);
    }
    else
    {
      TM = Math.sqrt((B.x * B.x) + (B.y * B.y));
    }

    return (TM);
  };

  //-------------

  CoOrdTransform.prototype.mapMagnitudeInX = function(M, Inv)
  {
    return this.mapMagnitude(M, true, Inv);
  };

  //-------------

  CoOrdTransform.prototype.mapMagnitudeInY = function(M, Inv)
  {
    return this.mapMagnitude(M, false, Inv);
  };

  //-------------

  CoOrdTransform.prototype.isIndentity = function()
  {
    return this.M.IsIdentity;
  };

  //-------------

  CoOrdTransform.prototype.eq = function(T)
  {
    return this.M.eq(T.M);
  };

  //-------------

  CoOrdTransform.prototype.ne = function(T)
  {
    return this.M.ne(T.M);
  };

  //-------------

  CoOrdTransform.prototype.realizeLineMapping = function(Pt1, Pt2, Val1, Val2)
  {
    var Rotation,Scale;
    var D = Pt2.copy();

    D.sube(Pt1);

    Rotation = D.phase();
    Scale    = D.mag() / Math.abs(Val2 - Val1);

    this.reset();
    this.translate(gxPt(-Val1, 0));
    this.scale(gxPt(Scale, Scale));
    this.rotate(Rotation);
    return this;
  };

  //-------------

  CoOrdTransform.prototype.setCanvasTranform = function(canvas, inverse)
  {
    if (inverse === true)
    {
      canvas.setTransform(this.IM.A, this.IM.B, this.IM.C, this.IM.D, this.IM.H, this.IM.K);
    }
    else
    {
      canvas.setTransform(this.M.A, this.M.B, this.M.C, this.M.D, this.M.H, this.M.K);
    }

    return this;
  };

  return new CoOrdTransform(Pt, InitType);
}


//-------------
// gxImageSnapshot class
//-------------
function gxImageSnapshot()
{
  function ImageSnapshot()
  {
    var origin_x    = 0;
    var origin_y    = 0;
    var image_data  = undefined;

    this.capture = function(ctx, extent)
    {
      // Need to ensure the capture rect actually lies wholey within the canvas
      var canvas_rect  = gxRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      var capture_rect = extent.intersect(canvas_rect);

      origin_x    = capture_rect.tl.x;
      origin_y    = capture_rect.tl.y;
      image_data  = ctx.getImageData(origin_x, origin_y, capture_rect.width(), capture_rect.height());
    };

    this.restore = function(ctx)
    {
      if (image_data !== undefined)
      {
        ctx.putImageData(image_data, origin_x, origin_y);

        image_data  = undefined;
        origin_x    = 0;
        origin_y    = 0;
      }
    };
  };

  return new ImageSnapshot();
}


//-------------
// gxHitMap class
//-------------
function gxHitMap()
{
  function HitMap()
  {
    var ctx           = undefined;
    var canvasElement = document.createElement('canvas');
    var hit_map       = {};
    var colour_map    = {};
    var image_data    = undefined;
    var hit_obj       = undefined;

    var newColour = function()
    {
      var colour24, red, green, blue, bAgain = true;

      while (bAgain)
      {
        colour24 = Math.floor(Math.random() * 16777214) + 1;

        if (colour_map[colour24] === undefined)
        {
          colour_map[colour24] = 1;
          bAgain               = false;
        }
      }

      red       = colour24 & 0xFF;
      colour24 /= 256;
      green     = colour24 & 0xFF;
      colour24 /= 256;
      blue      = colour24 & 0xFF;

      return ("rgba(" + red + "," + green + "," + blue + ",255)");
    }

    this.beginUpdate = function(width, height)
    {
      canvasElement.width  = width;
      canvasElement.height = height;
      ctx                  = canvasElement.getContext('2d');
      hit_map              = {};
      colour_map           = {};

      ctx.clearRect(0, 0, width, height);

      return (ctx);
    }

    this.endUpdate = function()
    {
      image_data = ctx.getImageData(0, 0, canvasElement.width, canvasElement.height);
    };

    this.addObject = function(Obj)
    {
      var colour = newColour();

      hit_map[colour] = Obj;

      return (colour);
    };

    this.testHit = function(x, y)
    {
      hit_obj = undefined;

      if (image_data !== undefined)
      {
        var idx     = y * image_data.width * 4 + x * 4;
        var colour  = "rgba(" + image_data.data[idx] + "," + image_data.data[idx + 1] + "," + image_data.data[idx + 2] + ","+ image_data.data[idx + 3] + ")";

        hit_obj = hit_map[colour];
      }

      return (hit_obj);
    };

    this.clearHit = function()
    {
      hit_obj = undefined;
    }

    this.hitObject = function()
    {
      return (hit_obj);
    };
  }

  var Obj = new HitMap();

  return (Obj);
}


//-------------
// gxCallbackInstance class
//-------------
function gxCallbackInstance()
{
  function CallbackInstance()
  {
    var Callbacks = [];

    this.addCallback = function(rContext, callbackFn)
    {
      if ((callbackFn !== undefined) && (typeof callbackFn === "function"))
      {
        var Context = {source:rContext, fn:callbackFn};
        var index   = Callbacks.findIndex(function(element)
                                                   {
                                                     return ((element.fn === Context.fn) && (element.source === Context.source));
                                                   });

        if (index === -1)
        {
          Callbacks.push(Context);
        }
      }

      return this;
    };

    //-------------

    this.removeCallback = function(rContext, callbackFn)
    {
      if ((callbackFn !== undefined) && (typeof callbackFn === "function"))
      {
        var Context = {source:rContext, fn:callbackFn};
        var index   = Callbacks.findIndex(function(element)
                                          {
                                            return ((element.fn === Context.fn) && (element.source === Context.source));
                                          });

        if (index >= 0)
        {
          Callbacks.splice(index, 1);
        }

        return this;
      }
    };

    //-------------

    this.invoke = function()
    {
      var args = (arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments));

      // Call callback with same arguments as passed in invoke() call.
      Callbacks.forEach(function(Context) {Context.fn.apply(Context.source, args);});
    }
  }

  var Obj = new CallbackInstance();

  return (Obj);
}


//-------------
// gxMouseWheelFilter class
//-------------
function gxMouseWheelFilter(element)
{
  function MouseWheelFilter(element)
  {
    var style     = window.getComputedStyle(element, null).getPropertyValue('font-size');
    var font_size = parseFloat(style);

    //-------------

    this.scrollBy = function(event)
    {
      var lines = 0;

      switch(event.deltaMode)
      {
        case 0:
          if (Math.abs(event.deltaY) > font_size)
          {
            lines = Math.trunc(event.deltaY / font_size);
          }
          else
          {
            lines = (event.deltaY >= 0 ? 1 : -1);
          }
          break;

        case 1:
        case 2:
          lines = event.deltaY;
          break;

        default:
          break;
      }

      return (lines);
    }
  };

  var Obj = new MouseWheelFilter(element);

  return (Obj);
}


// -------------
// Helper function to find position of element in page
// -------------
function gxClientPosInPage(element)
{
  var rect = gxRect();

  rect.screenExtent(element);

  return (gxPt(rect.tl.x + element.clientLeft, rect.tl.y + element.clientTop));
}


// -------------
// Helper function to find average char width
// -------------
function gxAvgCharWidth(canvasElement, font)
{
  var size;
  var avg_text  = "1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ ";
  var ctx       = canvasElement.getContext('2d');

  ctx.font = font;
  size     = ctx.measureText(avg_text);

  return (size.width / avg_text.length);
}


// -------------
// Helper function to add style to element
// -------------
function gxElementSetStyle(element, key, value)
{
  if (element['style'] == undefined)
  {
    element.setAttribute('style', key + ":" + value + ";");
  }
  else
  {
    element['style'][key] = value;
  }
}


// -------------
// Helper function to determine scroll bar sizes.
// -------------
function gxScrollSizes()
{
  var div = document.createElement('div');

  div.style.position      = "absolute";
  div.style.visibility    = "hidden";
  div.style.width         = "100px";
  div.style.height        = "100px";
  div.style["overflow-x"] = "scroll";
  div.style["overflow-y"] = "scroll";

  document.body.appendChild(div);

  var sizes = {x:div.offsetWidth - div.clientWidth,y:div.offsetHeight - div.clientHeight};

  document.body.removeChild(div);

  return sizes;
}


//-------------
// gxNumberToString class
//-------------
function gxNumberToString(bWhitespaceSeperate = false)
{
  function NumberToString(bWhitespaceSeperate)
  {
    var WhitespaceSeperate = bWhitespaceSeperate;

    function engineeringFormat(fValue, nExponent, nPrecision)
    {
      var fNormalisedValue  = fValue;
      var nMultiplierChar   = '';

      switch (nExponent)
      {
        case -15:
        case -14:
        case -13:
          fNormalisedValue *= 1e+15;
          nMultiplierChar   = 'f';
          break;

        case -12:
        case -11:
        case -10:
          fNormalisedValue *= 1e+12;
          nMultiplierChar   = 'p';
          break;

        case -9:
        case -8:
        case -7:
          fNormalisedValue *= 1e+9;
          nMultiplierChar   = 'n';
          break;

        case -6:
        case -5:
        case -4:
          fNormalisedValue *= 1e+6;
          nMultiplierChar   = 'u';
          break;

        case -3:
        case -2:
        case -1:
          fNormalisedValue *= 1e+3;
          nMultiplierChar   = 'm';
          break;

        case 0:
        case 1:
        case 2:
          break;

        case 3:
        case 4:
        case 5:
          fNormalisedValue *= 1e-3;
          nMultiplierChar   = 'k';
          break;

        case 6:
        case 7:
        case 8:
          fNormalisedValue *= 1e-6;
          nMultiplierChar   = 'M';
          break;

        case 9:
        case 10:
        case 11:
          fNormalisedValue *= 1e-9;
          nMultiplierChar   = 'G';
          break;

        case 12:
        case 13:
        case 14:
          fNormalisedValue *= 1e-12;
          nMultiplierChar   = 'T';
          break;

        default:
          break;
      }

      if (WhitespaceSeperate)
      {
        return (fNormalisedValue.toPrecision(nPrecision) + " " + nMultiplierChar);
      }
      else
      {
        return (fNormalisedValue.toPrecision(nPrecision) + nMultiplierChar);
      }
    };

    this.format = function(fValue, nPrecision = 3)
    {
      var nExponent = 0;

      if (fValue !== 0)
      {
        var arg = 1.000000000000001 * Math.log(Math.abs(fValue)) / Math.LN10;

        nExponent = arg >= 0 ? Math.floor(arg) : Math.ceil(arg);
      }

      return engineeringFormat(fValue, nExponent, nPrecision);
    };
  };

  var Obj = new NumberToString(bWhitespaceSeperate);

  return (Obj);
};


//-------------
// gxUnits class
//-------------
function gxUnits(unitName, unitPower)
{
  function Units(unitName, unitPower)
  {
    var UnitString;

    if (unitName !== undefined)
    {
      if ((unitName[0] === '%') && (unitName[1] !=='%'))
      {
        UnitString = unitName;
      }
      else
      {
        UnitString = '%' + (unitName || '') + ((unitPower !== undefined) ? ('^' + unitPower) : '') + '%';
      }
    }
    else
    {
      UnitString = '';
    }

    //-------------

    function extractUnits(SrcStr, DestList, DestHash, bInvert)
    {
      var Str     = SrcStr;
      var re      = /(%([\w\s]+)\^([\+\-]?\d+)%)|%(\w+)%/;
      var Sign    = (bInvert || false) ? -1 : 1;
      var Result;

      for (Result = re.exec(Str) ; Result !== null ; Result = re.exec(Str))
      {
        if (Result[1] != null)
        {
          if (DestHash[Result[2]] == null)
          {
            DestHash[Result[2]] = Sign * parseInt(Result[3], 10);
            DestList.push(Result[2]);
          }
          else
          {
            DestHash[Result[2]] += Sign * parseInt(Result[3], 10);
          }
        }
        else
        {
          if (DestHash[Result[4]] == null)
          {
            DestHash[Result[4]] = Sign;
            DestList.push(Result[4]);
          }
          else
          {
            DestHash[Result[4]] += Sign;
          }
        }

        Str = Str.replace(re, '');
      }
    };

    //-------------

    function buildUnitString(UnitsList, UnitsHash)
    {
      var UnitString = '';

      for (var cn = 0 ; cn < UnitsList.length ; cn++)
      {
        var Unit     = UnitsList[cn];
        var Exponent = UnitsHash[Unit];

        if (Exponent !== 0)
        {
          UnitString += '%' + Unit + ((Exponent != 1) ? ('^' + Exponent) : '') + '%';
        }
      }

      return UnitString;
    };

    //-------------

    this.copy = function()
    {
      var rUnits = new Units(UnitString);

      return rUnits;
    };

    //-------------

    this.unitString = function()
    {
      return UnitString;
    };

    //-------------

    this.mul = function(rUnits)
    {
      var rCopy = this.copy();

      return rCopy.mule(rUnits);
    };

    //-------------

    this.div = function(rUnits)
    {
      var rCopy = this.copy();

      return rCopy.dive(rUnits);
    };

    //-------------

    this.mule = function(rUnits)
    {
      var UnitList = [];
      var UnitHash = {};

      extractUnits(UnitString, UnitList, UnitHash, false);
      extractUnits(rUnits.unitString(), UnitList, UnitHash, false);

      UnitString = buildUnitString(UnitList, UnitHash);

      return this;
    };

    //-------------

    this.dive = function(rUnits)
    {
      var UnitList = [];
      var UnitHash = {};

      extractUnits(UnitString, UnitList, UnitHash, false);
      extractUnits(rUnits.unitString(), UnitList, UnitHash, true);

      UnitString = buildUnitString(UnitList, UnitHash);

      return this;
    };

    //-------------

    this.invert = function()
    {
      var UnitList = [];
      var UnitHash = {};

      extractUnits(UnitString, UnitList, UnitHash, true);

      UnitString = buildUnitString(UnitList, UnitHash);

      return this;
    };

    //-------------

    this.forEach = function(rCallback)
    {
      if (rCallback !== undefined)
      {
        var UnitList = [];
        var UnitHash = {};

        extractUnits(UnitString, UnitList, UnitHash, false);

        for (var cn = 0 ; cn < UnitList.length ; cn++)
        {
          var Unit     = UnitList[cn];
          var Exponent = UnitHash[Unit];

          if (Exponent !== 0)
          {
            rCallback.call(this, Unit, Exponent);
          }
        }
      }

      return this;
    };

    //-------------

    this.toString = function()
    {
      var Str       = '';
      var NumStr    = '';
      var DenomStr  = '';
      var callback  = function(Unit, Exponent)
                      {
                        if (Exponent > 0)
                        {
                          NumStr += Unit;

                          if (Exponent != 1)
                          {
                            NumStr += '^' + Exponent;
                          }
                        }
                        else
                        {
                          DenomStr += Unit;

                          if (Exponent != -1)
                          {
                            DenomStr += '^' + (-Exponent);
                          }
                        }
                      };

      this.forEach(callback);

      if (NumStr.length > 0)
      {
        Str = NumStr;

        if (DenomStr.length > 0)
        {
          Str += '/' + DenomStr;
        }
      }
      else if (DenomStr.length > 0)
      {
        Str = '1/' + DenomStr;
      }

      return Str;
    };
  }

  var Obj = new Units(unitName, unitPower);

  return (Obj);
};


//-------------
// gxAxisRenderer class
//-------------
function gxAxisRenderer(rtype, rdir, ralign, rxmax, rxmin, rlength, roptions)
{
  function AxisRenderer(rtype, rdir, ralign, rxmax, rxmin, rlength, roptions)
  {
    var xmax    = 1.0;
    var xmin    = 0.0;
    var length  = rlength;
    var type    = rtype;  // 0=linear; 1=logarithmic
    var dir     = rdir;   // 0=horizontal; 1=vertical
    var align   = ralign; // 0=bottom; 1=top
    var options = {
                    'axis-line-width': 0.5,
                    'axis-line-colour': 'black',
                    'axis-tick-size': 5,
                    'axis-font-face':'arial',
                    'axis-font-colour': 'black',
                    'axis-font-size':12
                  };

    var mergeOptions = function(_options)
    {
      if (_options !== undefined)
      {
        Object.keys(_options).forEach(function(element)
                                      {
                                        if (options[element] === undefined)
                                        {
                                          throw element + ' is not a valid gxAxisRenderer option';
                                        }
                                        else
                                        {
                                          options[element] = _options[element];
                                        }
                                      });
      }
    }

    //-------------

    this.setOptions = function(roptions)
    {
      mergeOptions(roptions);
    }

    //-------------

    this.range = function(rxmax, rxmin, rlength)
    {
      if (rxmax > rxmin)
      {
        xmax = rxmax;
        xmin = rxmin;
      }
      else
      {
        xmax = rxmin;
        xmin = rxmax;
      }

      if (rlength !== undefined)
      {
        length = rlength;
      }
    };

    //-------------

    this.maximum = function()
    {
      return (xmax);
    };

    //-------------

    this.minimum = function()
    {
      return (xmin);
    };

    //-------------

    this.height = function()
    {
      return (options['axis-font-size'] + 3 * (options['axis-font-size'] + options['axis-tick-size']) / 2);
    },

    //-------------

    this.valueToPixel = function(val)
    {
      var pix = undefined;

      if (val > xmax)
      {
        pix = length;
      }
      else if (val < xmin)
      {
        pix = 0;
      }
      else
      {
        switch (type)
        {
          case 0:
            pix = length * (val - xmin) / (xmax - xmin);
            break;

          case 1:
            pix = length * (Math.log(val) - Math.log(xmin)) / (Math.log(xmax) - Math.log(xmin));
            break;

          default:
            break;
        }
      }

      return (pix);
    }

    //-------------

    this.pixelToValue = function(pix)
    {
      var val = undefined;

      if (pix > length)
      {
        val = xmax;
      }
      else if (pix < 0)
      {
        val = xmin;
      }
      else
      {
        switch (type)
        {
          case 0:
            val = xmin + (xmax - xmin) * pix / length;
            break;

          case 1:
            val = Math.exp(Math.log(xmin) + (Math.log(xmax) - Math.log(xmin)) * pix / length);
            break;

          default:
            break;
        }
      }

      return (val);
    }

    //-------------

    this.render = function(ctx, x, y)
    {
      var fLabelSize,fSpace,nextra,nsign;

      fSpace      = options['axis-tick-size'] * 0.5;
      fLabelSize  = options['axis-font-size'] * 4;

      if (ralign === 0)
      {
        nsign  = 1.0;
        nextra = options['axis-font-size'];
      }
      else
      {
        nsign  = -1.0;
        nextra = 0.0;
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0);

      if (rdir === 0)
      {
        // horizontal
        ctx.translate(x, y);
      }
      else
      {
        // vertical
        ctx.translate(x, y);
        ctx.rotate(-90 * Math.PI / 180);
      }

      switch (type)
      {
        case 0:
          {
            // Linear axis
            var fDesiredSteps;
            var fPowerOfTen,nExponent,nBase,i,j;

            if ((length / fLabelSize) > 12)
            {
              fDesiredSteps = (xmax - xmin) / 12;
            }
            else
            {
              fDesiredSteps = fLabelSize * (xmax - xmin) / length;
            }

            fPowerOfTen = (1.000000000000001 * Math.log(fDesiredSteps) / Math.LN10);
            nExponent   = Math.floor(fPowerOfTen);

            if (nExponent > fPowerOfTen)
            {
              nExponent--;
            }

            var fStep  = Math.pow(10, nExponent);
            var nBases = [1,2,5,10];

            nBase = nBases.reduce(function(acc,val)
                                  {
                                    return ((fStep * val <= fDesiredSteps) ? val : acc);
                                  });

            fStep = nBase * fStep;

            i = Math.ceil(xmin / fStep);
            j = Math.floor(xmax / fStep);

            var fScale = length / (xmax - xmin);

            var x1,y1,x2,y2,P,Num,cn;

            ctx.beginPath();
            ctx.lineWidth   = options['axis-line-width'];
            ctx.strokeStyle = options['axis-line-colour'];
            ctx.moveTo(0, 0);
            ctx.lineTo(length, 0);
            ctx.stroke();

            ctx.font          = options['axis-font-size'] + 'px ' + options['axis-font-face'];
            ctx.fillStyle     = options['axis-font-colour'];
            ctx.textBaseline  = 'alphabetic';
            ctx.textAlign     = 'center';

            y1 = 0;
            y2 = y1 + options['axis-tick-size'] * nsign;

            for (cn = i ; cn <= j ; cn++)
            {
              P  = cn * fStep;
              x1 = (P - xmin) * fScale;
              y1 = 0;
              x2 = x1;

              ctx.moveTo(x1, y1);
              ctx.lineTo(x2, y2);
              ctx.stroke();

              y1  = y2 + (fSpace + nextra) * nsign;
              Num = cn * nBase;

              ctx.fillText(Num, x1, y1);
            }

            x1 = length;
            y1 = y2 + (fSpace + (3 * options['axis-font-size'] / 2) + nextra) * nsign;

            ctx.textAlign = 'right';

            ctx.fillText("x 10e" + nExponent.toPrecision(1), x1, y1);
          };
          break;

        case 1:
          // Log axis
          {
            var nTickDecimation,nPixelsPerDecade,fPowerOfTen,nExponent,i,j;

            nPixelsPerDecade  = Math.floor(length * Math.LN10 / (Math.log(xmax) - Math.log(xmin)));
            fPowerOfTen       = (1.000000000000001 * Math.log(xmin) / Math.LN10);
            nExponent         = Math.floor(fPowerOfTen);

            if (nPixelsPerDecade >= 120)
            {
              //All 10 ticks per decade
              nTickDecimation = 0;
            }
            else if (nPixelsPerDecade >= 60)
            {
              //5 ticks per decade
              nTickDecimation = 10;
            }
            else if (nPixelsPerDecade >= 30)
            {
              //2 ticks per decade
              nTickDecimation = 20;
            }
            else
            {
              //1 tick per decade
              nTickDecimation = 30;
            }

            if (nExponent > fPowerOfTen)
            {
              nExponent--;
            }

            var fStep         = Math.pow(10, nExponent);
            var nBaseExponent = nExponent;

            if (fLabelSize * 3 <= nPixelsPerDecade)
            {
              nLabelsPerDecade = 3;
            }
            else if (fLabelSize * 2 <= nPixelsPerDecade)
            {
              nLabelsPerDecade = 2;
            }
            else
            {
              nLabelsPerDecade = 1;
            }

            var fScale = length / (Math.log(xmax) - Math.log(xmin));

            var x1,y1,x2,y2,P,fTickValue,cn,fBaseStep;

            ctx.beginPath();
            ctx.lineWidth   = options['axis-line-width'];
            ctx.strokeStyle = options['axis-line-colour'];
            ctx.moveTo(0, 0);
            ctx.lineTo(length, 0);
            ctx.stroke();

            ctx.font          = options['axis-font-size'] + 'px ' + options['axis-font-face'];
            ctx.fillStyle     = options['axis-font-colour'];
            ctx.textBaseline  = 'alphabetic';
            ctx.textAlign     = 'center';

            fBaseStep = 1;

            while (fStep <= xmax)
            {
              fTickValue = fStep;

              if ((fTickValue >= xmin) && (fTickValue <= xmax))
              {
                P  = Math.log(fTickValue);
                x1 = (P - Math.log(xmin)) * fScale;
                y1 = 0;
                x2 = x1;
                y2 = y1 + options['axis-tick-size'] * nsign;

                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();

                y1 = y2 + (fSpace + nextra) * nsign;

                ctx.fillText(fBaseStep, x1, y1);
              }

              for (cn = 2 ; cn <= 9 ; cn++)
              {
                var bShowTick = false;

                switch (cn + nTickDecimation)
                {
                  case 2:
                  case 3:
                  case 4:
                  case 5:
                  case 6:
                  case 7:
                  case 8:
                  case 9:
                  case 12:
                  case 14:
                  case 16:
                  case 18:
                  case 25:
                    bShowTick = true;
                    break;

                  default:
                    bShowTick = false;
                    break;
                }

                if (bShowTick)
                {
                  fTickValue  = cn * fStep;

                  if ((fTickValue >= xmin) && (fTickValue <= xmax))
                  {
                    P  = Math.log(fTickValue);
                    x1 = (P - Math.log(xmin)) * fScale;
                    y1 = 0;
                    x2 = x1;
                    y2 = y1 + 0.7 * options['axis-tick-size'] * nsign;

                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();

                    if (((nLabelsPerDecade == 2) && (cn == 5)) ||
                        ((nLabelsPerDecade == 3) && ((cn == 2) || (cn == 5))))
                    {
                      y1 = y2 + (fSpace + nextra) * nsign;

                      ctx.fillText(cn * fBaseStep, x1, y1);
                    }
                  }
                }
              }

              fStep     *= 10.0;
              fBaseStep *= 10.0;

              nExponent++;
            }

            x1 = length;
            y1 = y2 + (fSpace + (3 * options['axis-font-size'] / 2) + nextra) * nsign;

            ctx.textAlign = 'right';

            ctx.fillText("x 10e" + nBaseExponent.toPrecision(1), x1, y1);
          }
          break;

        default:
          break;
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0);

      return (this);
    };

    mergeOptions(roptions);
    this.range(rxmax, rxmin);
  };

  var Obj = new AxisRenderer(rtype, rdir, ralign, rxmax, rxmin, rlength, roptions);

  return (Obj);
}


//-------------
// gxColourScale class
//-------------
function gxColourScale(_container_id, _options = undefined)
{
  function ColourScale(_container_id, _options)
  {
    var parentDiv = document.getElementById(_container_id);
    var CanvasId  = _container_id + "-colourscale";
    var DialogId  = _container_id + "-colourscale-dlg";

    parentDiv.innerHTML   = "<div style='width:100%;height:100%;position:relative;'><canvas id='" + CanvasId + "'>You will need a browser that supports canvas to display heat maps.</canvas></div><div id='" + DialogId + "'></div>";

    var canvasElement     = document.getElementById(CanvasId);
    var changed_callbacks = gxCallbackInstance();
    var ColourMap         = undefined;
    var instance          = this;
    var client_pos        = gxClientPosInPage(canvasElement);
    var fillHeight        = 0;
    var options           = {
                              'scale-line-width': 0.5,
                              'scale-line-colour': 'black',
                              'scale-tick-size': 5,
                              'scale-font-face': 'arial',
                              'scale-font-colour': 'black',
                              'scale-font-size': 12,
                              'scale-map-definition': [[0.0, '#0000FF', true],[1.0, '#FF0000', false]],
                              'scale-length': 400,
                              'scale-dir': 0, // 0=horizontal; 1=vertical
                              'scale-margin': 10,
                              'scale-islog': false
                            };

    //-------------

    var mergeOptions = function(_options)
    {
      if (_options !== undefined)
      {
        Object.keys(_options).forEach(function(element)
                                      {
                                        if (options[element] === undefined)
                                        {
                                          throw element + ' is not a valid gxColourScale option';
                                        }
                                        else
                                        {
                                          options[element] = _options[element];
                                        }
                                      });
      }
    }

    //-------------

    var draw = function()
    {
      var x,y,cn;
      var ctx          = canvasElement.getContext('2d');
      var rtype        = options['scale-islog'] ? 1 : 0;
      var rdir         = options['scale-dir'];
      var ralign       = 0;
      var rxmax        = ColourMap.maximum();
      var rxmin        = ColourMap.minimum();
      var rlength      = options['scale-length'];
      var margin_part  = options['scale-margin'] * 2;
      var totalHeight  = 0;
      var AxisRenderer = gxAxisRenderer(rtype, rdir, ralign, rxmax, rxmin, rlength, {'axis-line-width':   options['scale-line-width'],
                                                                                     'axis-line-colour':  options['scale-line-colour'],
                                                                                     'axis-tick-size':    options['scale-tick-size'],
                                                                                     'axis-font-face':    options['scale-font-face'],
                                                                                     'axis-font-colour':  options['scale-font-colour'],
                                                                                     'axis-font-size':    options['scale-font-size']});

      fillHeight  = AxisRenderer.height() * 0.4;
      totalHeight = fillHeight + AxisRenderer.height();

      if (rdir === 0)
      {
        canvasElement.width   = margin_part + options['scale-length'];
        canvasElement.height  = margin_part + totalHeight;

        for (cn = 0 ; cn < rlength ; cn++)
        {
          var val = AxisRenderer.pixelToValue(cn);

          ctx.fillStyle = ColourMap.map(val);
          ctx.fillRect(options['scale-margin'] + cn + 0.5, options['scale-margin'] + 0.5, 1.0, fillHeight);
        }

        ctx.beginPath();
        ctx.lineWidth   = options['scale-line-width'];
        ctx.strokeStyle = options['scale-line-colour'];
        ctx.strokeRect(options['scale-margin'] + 0.5, options['scale-margin'] + 0.5, options['scale-length'], fillHeight);

        x = options['scale-margin'] + 0.5;
        y = options['scale-margin'] + 0.5 + fillHeight;
      }
      else
      {
        canvasElement.width   = margin_part + totalHeight;
        canvasElement.height  = margin_part + options['scale-length'];

        for (cn = 0 ; cn < rlength ; cn++)
        {
          var val = AxisRenderer.pixelToValue(rlength - cn - 1);

          ctx.fillStyle = ColourMap.map(val);
          ctx.fillRect(options['scale-margin'] + 0.5, options['scale-margin'] + cn + 0.5, fillHeight, 1.0);
        }

        ctx.beginPath();
        ctx.lineWidth   = options['scale-line-width'];
        ctx.strokeStyle = options['scale-line-colour'];
        ctx.strokeRect(options['scale-margin'] + 0.5, options['scale-margin'] + 0.5, fillHeight, options['scale-length']);

        x = options['scale-margin'] + 0.5 + fillHeight;
        y = options['scale-margin'] + 0.5 + options['scale-length'];
      }

      AxisRenderer.render(ctx, x, y);
    }

    //-------------

    this.addChangedCallback = function(callbackFn)
    {
      changed_callbacks.addCallback(this, callbackFn);
    };

    //-------------

    this.removeChangedCallback = function(callbackFn)
    {
      changed_callbacks.removeCallback(this, callbackFn);
    };

    //-------------

    this.getOptions = function(keys)
    {
      var result = undefined;

      if (Array.isArray(keys))
      {
        result = {};

        keys.forEach(function(element)
                     {
                       if (options[element] !== undefined)
                       {
                         result[element] = options[element];
                       }
                       else
                       {
                         throw element + ' is not a valid gxColourScale option';
                       }
                     });
      }
      else
      {
        if (options[keys] !== undefined)
        {
          result = options[keys];
        }
        else
        {
          throw keys + ' is not a valid gxColourScale option';
        }
      }

      return result;
    };

    //-------------

    this.setOptions = function(_options, bUpdate = false)
    {
      mergeOptions(_options);

      ColourMap.initialise(options['scale-map-definition'], options['scale-islog']);

      if (bUpdate)
      {
        draw();
      }
    };

    //-------------

    this.colourMap = function()
    {
      return (ColourMap);
    }

    //-------------

    this.configure = function()
    {
      var def    = options['scale-map-definition'].map(function(val)
                                                       {
                                                         return val.slice(0);
                                                       });
      var is_log = options['scale-islog'];

      var readDialog = function()
      {
        var limit, last_limit, error_string;
        var bOk = true;

        is_log = $("#" + DialogId + "_is_log").prop("checked");

        $("#" + DialogId + "_error_msg").html("");

        for (cn = 0 ; cn < def.length ; cn++)
        {
          var limit_str,colour_str,blend;

          limit_str  = $("#" + DialogId + "_limit_" + cn).prop("value");
          colour_str = $("#" + DialogId + "_colour_" + cn).spectrum("get").toRgbString();

          limit = parseFloat(limit_str);

          if (isNaN(limit))
          {
            // Error parsing number
            error_string  = "Invalid number in limit field";
            bOk           = false;
          }
          else if ((is_log) && (limit <= 0))
          {
            // Error as log limits must be strictly positive
            error_string  = "Limit field must be strictly positive when using logarithmic format";
            bOk           = false;
          }
          else if ((cn != 0) && (limit <= last_limit))
          {
            // Error as limits must be strictly ascending
            error_string  = "Limit fields must be strictly ascending";
            bOk           = false;
          }

          if (cn < def.length - 1)
          {
            blend = $("#" + DialogId + "_blend_" + cn).prop("checked");
          }
          else
          {
            blend = false;
          }

          $("#" + DialogId + "_error_field_" + cn).html("");

          if (bOk)
          {
            def[cn][0] = limit;
            def[cn][1] = colour_str;
            def[cn][2] = blend;

            last_limit = limit;
          }
          else
          {
            $("#" + DialogId + "_error_msg").html(error_string);
            $("#" + DialogId + "_error_field_" + cn).html("*");
            break;
          }
        }

        return bOk;
      }

      var addEntry = function()
      {
        if (readDialog())
        {
          var nLast = def.length - 1;

          def[nLast + 1] = def[nLast].slice(0);

          initDialog();
        }
      }

      var removeEntry = function()
      {
        if (def.length > 2)
        {
          def.splice(def.length - 1, 1);

          initDialog();
        }
      }

      var initDialog = function()
      {
        var formHtml = "<div id='" + DialogId + "_error_msg'></div>";
        var cn;

        formHtml += "<table><tbody><tr><th></th><th>Limit</th><th>Colour</th><th>Blend</th></tr>";

        for (cn = 0 ; cn < def.length ; cn++)
        {
          formHtml += "<tr><td id='" + DialogId + "_error_field_" + cn + "'/></td>";
          formHtml += "<td><input type='text' id='" + DialogId + "_limit_" + cn + "' value='" + def[cn][0] + "'/></td>";
          formHtml += "<td><input type='text' id='" + DialogId + "_colour_" + cn + "'></input></td>";

          if (cn < def.length - 1)
          {
            formHtml += "<td><input type='checkbox' id='" + DialogId + "_blend_" + cn + "'" + (def[cn][2] ? " checked" : "") + "/></td>";
          }
          else
          {
            formHtml += "<td><button id='" + DialogId + "_plus'/><button id='" + DialogId + "_minus'/></td>";
          }

          formHtml += "</tr>";
        }

        formHtml += "</tbody></table>Logarithmic <input type='checkbox' id='" + DialogId + "_is_log'" + (is_log ? " checked" : "") + "/>";

        $("#" + DialogId).html(formHtml);

        for (cn = 0 ; cn < def.length ; cn++)
        {
          $("#" + DialogId + "_colour_" + cn).spectrum({preferredFormat: "rgb", showAlpha:true, showInput: true, color:def[cn][1]});
        }

        $("#" + DialogId + "_plus").button({icons:{primary: "ui-icon-plus", secondary: "null"}}).click(addEntry);
        $("#" + DialogId + "_minus").button({icons:{primary: "ui-icon-minus", secondary: "null"}}).click(removeEntry);
      }

      var configureOk = function()
      {
        var bOk = readDialog();

        if (bOk)
        {
          $("#" + DialogId).dialog("close");

          options['scale-map-definition'] = def;
          options['scale-islog']          = is_log;

          ColourMap.initialise(options['scale-map-definition'], options['scale-islog']);

          draw();
          changed_callbacks.invoke();
        }
      }

      var configureCancel = function()
      {
        $("#" + DialogId).dialog("close");
      }

      initDialog();

      var max_width  = document.documentElement.clientWidth;
      var max_height = document.documentElement.clientHeight;

      $("#" + DialogId).dialog({
                                 closeText: "Close",
                                 height:"auto",
                                 width:"auto",
                                 maxHeight:max_height,
                                 maxWidth:max_width,
                                 draggable: true,
                                 title: "Colour Map Settings",
                                 buttons: [
                                            {
                                              text: "Ok",
                                              click: configureOk
                                            },
                                            {
                                              text: "Cancel",
                                              click: configureCancel
                                            }
                                          ]
                               });
    }

    //-------------

    var mouseUpHandler  = function(event)
                          {
                            instance.configure();
                          };

    canvasElement.addEventListener("mouseup", mouseUpHandler);
    mergeOptions(_options);

    ColourMap = gxSegmentedColourMap(options['scale-map-definition'], options['scale-islog']);

    draw();
  }

  var Obj = new ColourScale(_container_id, _options);

  return (Obj);
}


//-------------
// gxSizer class
//-------------
function gxSizer(_container_id, _parentSizer = undefined, _options = undefined)
{
  // Class for laying out divs in a containing div.
  //
  // The layout-plan attribute of the passed in options is a n by 2 array
  // where n is the number of child divs in the container (being layed out).
  // The first entry in each pair of n numbers is the size and the second is
  // a value to indicate if it is pixels (1) or a proportional measure(0) or
  // if the existing object child size should be preserved (2). Additionally
  // adding 4 (a bit flag) to it indicates that the uncontrolled direction
  // should be marked with a size of 100%. Laying out uses the entire available
  // space and does so by first establishing how much space is taken by the
  // fixed pixel sized elements and then proportioning the remainder by the
  // calculated porportion. That is,
  //
  // (proportion value / sum of proportions) * (available space).
  //
  // The layout-dir attribute controls the layout direction which is either
  // horizontal (inline) or vertical (block).
  function Sizer(_container_id, _parentSizer, _options)
  {
    var parentDiv       = document.getElementById(_container_id);
    var parentSizer     = _parentSizer;
    var updateCallbacks = gxCallbackInstance();
    var instance        = this;
    var options         = {
                            'layout-dir': 0, // 0 = horizontal; 1=vertical
                            'margin':0,
                            'layout-plan': null
                          };

    //-------------

    var mergeOptions = function(_options)
    {
      if (_options !== undefined)
      {
        Object.keys(_options).forEach(function(element)
                                      {
                                        if (_options[element] === undefined)
                                        {
                                          throw element + ' is not a valid gxSizer option';
                                        }
                                        else
                                        {
                                          options[element] = _options[element];
                                        }
                                      });


        for (var cn = 0 ; cn < parentDiv.children.length ; cn++)
        {
          var element = parentDiv.children[cn];

          if ((element.tagName !== "DIV") && (element.tagName !== "div"))
          {
            throw 'gxSizer container must only contain DIV elements';
          }
        }

        var layoutPlan = options['layout-plan'];

        if (layoutPlan !== null)
        {
          if (layoutPlan.length !== parentDiv.children.length)
          {
            throw 'gxSizer layout-plan must have the same length as the number of child DIV elements';
          }
        }
      }
    }

    //-------------

    this.addUpdateCallback = function(callbackFn)
    {
      updateCallbacks.addCallback(this, callbackFn);
    };

    //-------------

    this.removeUpdateCallback = function(callbackFn)
    {
      updateCallbacks.removeCallback(this, callbackFn);
    };

    //-------------

    this.updateLayout = function()
    {
      var floatType,widthSel,AvailableSpace;
      var extent = gxRect();

      extent.clientExtent(parentDiv);

      var rectObject = parentDiv.getBoundingClientRect();

      if (options['layout-dir'] === 0)
      {
        // horizontal
        floatType    = "left";
        widthSel     = "width";
        heightSel    = "height";

        AvailableSpace = extent.width();
      }
      else
      {
        // vertical
        floatType    = "bottom";
        widthSel     = "height";
        heightSel    = "width";

        AvailableSpace = extent.height();
      }

      gxElementSetStyle(parentDiv, "display", "block");

      var layoutPlan = options['layout-plan'];

      if (layoutPlan !== null)
      {
        var UsedSpace = 0;
        var TotalProp = 0;

        for (var cn = 0 ; cn < parentDiv.children.length ; cn++)
        {
          var element    = parentDiv.children[cn];
          var proportion = layoutPlan[cn][0];
          var type       = layoutPlan[cn][1];

          gxElementSetStyle(element, "float", floatType);

          extent.screenExtent(element);

          var cr = element.getClientRects();

          var size = {"width" : extent.width(), "height" : extent.height()};

          switch (type)
          {
            case 0:
            case 4:
              TotalProp += proportion;
              break

            case 1:
            case 5:
              // Hack.
              UsedSpace += proportion;
              break;

            case 2:
            case 6:
              UsedSpace += size[widthSel];
              break;

            default:
              break
          }
        }

        // Hack. We add 1 cos with 100% width specification of parent DIV
        // we seamingly end up with slightly more width of summed elements
        // than is available, leading to line wrap. This hack fixes the
        // problem but I should really figure out why it doesn't quite
        // add up. It might just be round off.
        AvailableSpace -= UsedSpace + 1 + options['margin'];

        if (AvailableSpace < 0)
        {
          AvailableSpace = 0;
        }

        for (var cn = 0 ; cn < parentDiv.children.length ; cn++)
        {
          var element    = parentDiv.children[cn];
          var proportion = layoutPlan[cn][0];
          var type       = layoutPlan[cn][1];

          switch (type)
          {
            case 4:
              element.style[heightSel] = "100%";
              // fall thru
            case 0:
              element.style[widthSel] = proportion * AvailableSpace / TotalProp + "px";
              break

            case 5:
              element.style[heightSel] = "100%";
              // fall thru
            case 1:
              element.style[widthSel] = proportion + "px";
              break;

            case 6:
              element.style[heightSel] = "100%";
              break;

            case 2:
            default:
              break
          }
        }
      }

      updateCallbacks.invoke();
    };

    //-------------

    var updateLayoutCallback = function()
    {
      this.updateLayout();
    }

    //-------------

    if (parentSizer !== undefined)
    {
      parentSizer.addUpdateCallback(updateLayoutCallback);
    }

    mergeOptions(_options);
    this.updateLayout();
  };

  var Obj = new Sizer(_container_id, _parentSizer, _options);

  return (Obj);
}


//-------------
// gxSizer class
//-------------
function gxSplitter(_container_id, _parentSplitter = undefined, _options = undefined)
{
  // Class for controlling the width of two adjacent windows using a splitter.
  function Splitter(_container_id, _parentSplitter, _options)
  {
    var parentDiv       = document.getElementById(_container_id);
    var parentSplitter  = _parentSplitter;
    var updateCallbacks = gxCallbackInstance();
    var position        = 0.5;
    var instance        = this;
    var inDrag          = false;
    var origin          = 0;
    var options         = {
                            'layout-dir': 0, // 0 = horizontal; 1=vertical
                            'position':0.5,
                            'width':3,
                            'edge-colour':"#C8C8C8",
                            'background-colour':"#F0F0F0",
                            'margin':0
                          };

    for (var cn = 0 ; cn < parentDiv.children.length ; cn++)
    {
      var element = parentDiv.children[cn];

      if ((element.tagName !== "DIV") && (element.tagName !== "div"))
      {
        throw 'gxSplitter container must only contain DIV elements';
      }
    }

    if (parentDiv.children.length !== 2)
    {
      throw 'gxSplitter container must have only 2 child DIV elements';
    }

    var ThumbDiv  = document.createElement("div");

    parentDiv.insertBefore(ThumbDiv, parentDiv.children[1]);

    var FirstDiv  = parentDiv.children[0];
    var SecondDiv = parentDiv.children[2];

    //-------------

    var mergeOptions = function(_options)
    {
      if (_options !== undefined)
      {
        Object.keys(_options).forEach(function(element)
                                      {
                                        if (_options[element] === undefined)
                                        {
                                          throw element + ' is not a valid gxSplitter option';
                                        }
                                        else
                                        {
                                          options[element] = _options[element];
                                        }
                                      });
      }
    }

    //-------------

    var moveSplitter = function(pagePos)
    {
      var client_extent = gxRect();
      var screen_extent = gxRect();

      client_extent.clientExtent(parentDiv);
      screen_extent.screenExtent(parentDiv);

      if (options['layout-dir'] === 0)
      {
        // horizontal
        var available_space = client_extent.width() - (options['width'] + options['margin'] + 2);
        var delta           = (screen_extent.width() - client_extent.width()) * 0.5;

        position = (pagePos - origin - 1 - screen_extent.tl.x - delta) / available_space;
      }
      else
      {
        // vertical
        var available_space = client_extent.height() - (options['width'] + options['margin'] + 2);
        var delta           = (screen_extent.height() - client_extent.height()) * 0.5;

        position = (pagePos - origin - 1 - screen_extent.tl.y - delta) / available_space;
      }

      if (position > 1.0)
      {
        position = 1.0;
      }
      else if (position < 0.0)
      {
        position = 0.0;
      }

      instance.updateLayout();
    }

    //-------------

    this.addUpdateCallback = function(callbackFn)
    {
      updateCallbacks.addCallback(this, callbackFn);
    };

    //-------------

    this.removeUpdateCallback = function(callbackFn)
    {
      updateCallbacks.removeCallback(this, callbackFn);
    };

    //-------------

    this.updateLayout = function()
    {
      var floatType,widthSel,AvailableSpace,cursor,BorderLeft,BorderRight;
      var extent = gxRect();

      extent.clientExtent(parentDiv);

      var rectObject = parentDiv.getBoundingClientRect();

      if (options['layout-dir'] === 0)
      {
        // horizontal
        floatType    = "left";
        widthSel     = "width";
        heightSel    = "height";
        cursor       = "col-resize";
        BorderLeft   = "border-left";
        BorderRight  = "border-right";

        AvailableSpace = extent.width();
      }
      else
      {
        // vertical
        floatType    = "bottom";
        widthSel     = "height";
        heightSel    = "width";
        cursor       = "row-resize";
        BorderLeft   = "border-top";
        BorderRight  = "border-bottom";

        AvailableSpace = extent.height();
      }

      gxElementSetStyle(parentDiv, "display", "block");
      gxElementSetStyle(FirstDiv,  "float",   floatType);
      gxElementSetStyle(SecondDiv, "float",   floatType);
      gxElementSetStyle(ThumbDiv,  "float",   floatType);

      gxElementSetStyle(ThumbDiv,  heightSel,   "100%");
      gxElementSetStyle(ThumbDiv,  widthSel,    options['width'] + "px");
      gxElementSetStyle(ThumbDiv,  "cursor",    cursor);
      gxElementSetStyle(ThumbDiv,  BorderLeft,  "1px solid " + options['edge-colour']);
      gxElementSetStyle(ThumbDiv,  BorderRight, "1px solid " + options['edge-colour']);
      gxElementSetStyle(ThumbDiv,  "background-color", options['background-colour']);

      AvailableSpace -= options['width'] + options['margin'] + 2;

      if (AvailableSpace < 0)
      {
        AvailableSpace = 0;
      }

      var FirstWidth  = AvailableSpace * position;
      var SecondWidth = AvailableSpace - FirstWidth;

      gxElementSetStyle(FirstDiv,  widthSel, FirstWidth  + "px");
      gxElementSetStyle(SecondDiv, widthSel, SecondWidth + "px");
      gxElementSetStyle(FirstDiv,  heightSel, "100%");
      gxElementSetStyle(SecondDiv, heightSel, "100%");

      updateCallbacks.invoke();
    };

    //-------------

    var updateLayoutCallback = function()
    {
      this.updateLayout();
    }

    //-------------

    var mouseDownHandler = function(event)
    {
      if (!inDrag)
      {
        origin = (options['layout-dir'] === 0) ? event.offsetX : event.offsetY;
        inDrag = true;

        event.stopPropagation();
        event.preventDefault();
      }
    }

    //-------------

    var mouseUpHandler = function(event, bFromThumb)
    {
      if (inDrag)
      {
        inDrag = false;
      }
    }

    //-------------

    var mouseMoveHandler = function(event, bFromThumb)
    {
      if (inDrag)
      {
        var thumbPos = (options['layout-dir'] === 0) ? event.pageX : event.pageY;

        moveSplitter(thumbPos);
        event.stopPropagation();
        event.preventDefault();
      }
    }

    //-------------

    if (parentSplitter !== undefined)
    {
      parentSplitter.addUpdateCallback(updateLayoutCallback);
    }

    ThumbDiv.addEventListener("mousedown", mouseDownHandler);
    ThumbDiv.addEventListener("mouseup",   mouseUpHandler);
    ThumbDiv.addEventListener("mousemove", mouseMoveHandler);
    document.addEventListener("mouseup",   mouseUpHandler);
    document.addEventListener("mousemove", mouseMoveHandler);

    mergeOptions(_options);
    this.updateLayout();
  };

  var Obj = new Splitter(_container_id, _parentSplitter, _options);

  return (Obj);
}
