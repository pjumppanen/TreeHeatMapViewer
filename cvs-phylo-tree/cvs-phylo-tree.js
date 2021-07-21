// ----------------------------------------------------------------------------
// cvs-phylo-tree.js
// ----------------------------------------------------------------------------
//  Purpose:
//    Phylogentic tree implemented using canvas drawing rather than HTML5 or SVG
//    This code is an adaptation of phylotree (https://github.com/veg/phylotree.js)
//    but as the implementation is a radical depature that won't be supporting
//    radial trees and will be supporting heat maps of abundance indicies it was
//    felt that there was little point in branching from the existing project.
//    A big thankyou to the authors of phylotree for the starting point in this
//    development.
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
// ----------------------------------------------------------------------------

function parseNewickString(nwk_str, filter_name_list, bootstrap_values)
{
  var clade_stack = [];
  var name_map    = {0:''};
  var name_count  = 0;
  var filter_map  = undefined;

  if (filter_name_list !== undefined)
  {
    if (Array.isArray(filter_name_list))
    {
      filter_map = {};

      filter_name_list.forEach(function(element)
                               {
                                 filter_map[element] = 1;
                               });
    }
    else if (typeof filter_name_list === 'object')
    {
      filter_map = filter_name_list;
    }
  }

  function addName(name_string)
  {
    var index = 0;

    if (name_string.length > 0)
    {
      name_count++;

      name_map[name_count] = name_string;
      index                = name_count;
    }

    return index;
  }

  function addNewTreeLevel()
  {
    var new_level  = {"name_index": null};
    var the_parent = clade_stack[clade_stack.length - 1];

    if (!("children" in the_parent))
    {
      the_parent.children = [];
    }

    clade_stack.push(new_level);
  }

  function finishNodeDefinition()
  {
    var add_node      = true;
    var this_node     = clade_stack.pop();
    var the_parent    = clade_stack[clade_stack.length - 1];
    var is_container  = 'children' in this_node;

    if (bootstrap_values && is_container)
    {
      this_node.bootstrap_values = current_node_name;
    }
    else
    {
      if ((filter_map !== undefined) && !is_container)
      {
        add_node = (current_node_name in filter_map);
      }

      if (add_node)
      {
        this_node.name_index = addName(current_node_name);
      }
    }

    var branch_length = parseFloat(current_node_attribute);

    if (isNaN(branch_length))
    {
      this_node.branch_length = 0.0;
    }
    else
    {
      this_node.branch_length = branch_length;
    }

    this_node.annotation = current_node_annotation;

    if (add_node)
    {
      if (is_container)
      {
        switch(this_node.children.length)
        {
          case 0:
            break;

          case 1:
            // If this node has only one child then simply push its child
            // instead of the node as it is suerfluous. We must update the
            // branch length though.
            var single_child = this_node.children[0];

            single_child.branch_length += this_node.branch_length;

            the_parent.children.push(single_child);
            break;

          default:
            the_parent.children.push(this_node);
            break;
        }
      }
      else
      {
        the_parent.children.push(this_node);
      }
    }

    current_node_name       = '';
    current_node_attribute  = '';
    current_node_annotation = '';
  }

  function generateError(location)
  {
    var result = {
                    "root"       : null,
                    "error"      : "Unexpected '" + nwk_str[location] + "' in '" + nwk_str.substring(location - 20, location + 1) + "[ERROR HERE]" + nwk_str.substring(location + 1, location + 20) + "'",
                    "name_count" : 0,
                    "name_map"   : {},
                    "comment"    : ""
                 };

    return (result);
  }

  var automaton_state         = 0;
  var current_node_name       = '';
  var current_node_attribute  = '';
  var current_node_annotation = '';
  var quote_delimiter         = null;
  var name_quotes             = {"'": 1, "\"": 1};
  var tree                    = {"name_index": 0};
  var tree_comment            = '';
  var comment_depth           = 0;
  var last_char               = 0;

  clade_stack.push(tree);

  var space = /\s/;

  for (var char_index = 0; char_index < nwk_str.length; char_index++)
  {
    try
    {
      var current_char = nwk_str[char_index];

      switch (automaton_state)
      {
        case 0:
        {
          // look for the first opening parenthesis
          if (current_char == '(')
          {
            addNewTreeLevel();
            automaton_state = 1; // expecting node name
          }
          else if (current_char == '[')
          {
            automaton_state = 5; // expecting comment block for tree
            comment_depth++;
          }
          break;
        }

        case 1: // name
        case 3: // branch length
        {
          // reading name
          if (current_char == ':')
          {
            if (automaton_state == 3)
            {
              return generateError(char_index);
            }

            automaton_state = 3;
          }
          else if (current_char == ',' || current_char == ')')
          {
            try
            {
              finishNodeDefinition();
              automaton_state = 1;

              if (current_char == ',')
              {
                addNewTreeLevel();
              }
            }
            catch (e)
            {
              return generateError(char_index);
            }
          }
          else if (current_char == '(')
          {
            if (current_node_name.length > 0)
            {
              return generateError(char_index);
            }
            else
            {
              addNewTreeLevel();
            }
          }
          else if (current_char in name_quotes)
          {
            if (automaton_state == 1 && current_node_name.length == 0 && current_node_attribute.length == 0 && current_node_annotation.length == 0)
            {
              automaton_state = 2;
              quote_delimiter = current_char;
              continue;
            }

            return generateError(char_index);
          }
          else
          {
            if (current_char == '[')
            {
              if (current_node_annotation.length)
              {
                return generateError(char_index);
              }
              else
              {
                automaton_state = 4;
                comment_depth++;
              }
            }
            else
            {
              if (automaton_state == 3)
              {
                current_node_attribute += current_char;
              }
              else
              {
                if (space.test(current_char))
                {
                  continue;
                }

                current_node_name += current_char;
              }
            }
          }
          break;
        }

        case 2:
        {
          if (current_char == quote_delimiter)
          {
            if (char_index < nwk_str.length - 1)
            {
              if (nwk_str[char_index + 1] == quote_delimiter)
              {
                char_index++;
                current_node_name += quote_delimiter;
                continue;
              }
            }

            quote_delimiter = 0;
            automaton_state = 1;
            continue;
          }
          else
          {
            current_node_name += current_char;
          }
          break;
        }

        case 4:
        {
          if ((current_char == ']') && (last_char != '.'))
          {
            comment_depth--;

            if (comment_depth == 0)
            {
              automaton_state = 3;
            }
          }
          else if ((current_char == '[') && (last_char != '.'))
          {
            comment_depth++;
          }

          if (automaton_state == 3)
          {
            current_node_annotation += current_char;
          }
          break;
        }

        case 5:
        {
          if ((current_char == ']') && (last_char != '.'))
          {
            comment_depth--;

            if (comment_depth == 0)
            {
              automaton_state = 0;
            }
          }
          else if ((current_char == '[') && (last_char != '.'))
          {
            comment_depth++;
          }

          if (automaton_state == 0)
          {
            tree_comment += current_char;
          }
          break;
        }

        default:
        {
          throw "invalid parser state";
        }
      }

      last_char = current_char;
    }
    catch (e)
    {
      return generateError(char_index);
    }
  }

  if (clade_stack.length != 1)
  {
    return generateError(nwk_str.length - 1);
  }

  var result = {
                 "root"       : tree,
                 "error"      : null,
                 "name_count" : name_count,
                 "name_map"   : name_map,
                 "comment"    : tree_comment
               };

  return (result);
}

// ----------------------------------------------------------------------------

function CvsPhylotree(_container_id, _options = undefined)
{
  function Phylotree(_container_id, _options)
  {
    var parentDiv     = document.getElementById(_container_id);
    var CanvasId      = _container_id + "-phylotree";
    var ScrollId      = _container_id + "-phylotree-scroll";
    var ContextId     = _container_id + "-phylotree-context";
    var MenuId        = _container_id + "-phylotree-context-menu";
    var instance      = this;

    var scroll_close_width = 10;
    var scroll_open_width  = 100;

    parentDiv.innerHTML = "<div style='width:100%;height:100%;position:relative;'><div style='position:absolute;overflow:hidden;left:0px;top:0px;width:" + scroll_close_width + "px;height:100%;z-index:1;transition:0.25s;'><canvas id='" + ScrollId + "'></canvas></div><canvas id='" + CanvasId + "'>You will need a browser that supports canvas to display phylogentic trees.</canvas><div id=" + ContextId + " style='position:absolute;left:0px;top:0px;display:none;'></div></div>";

    var canvasElement = document.getElementById(CanvasId);
    var scrollElement = document.getElementById(ScrollId);
    var scrollOverlay = scrollElement.parentElement;

    var mergeOptions = function(_options)
    {
      if (_options !== undefined)
      {
        Object.keys(_options).forEach(function(element)
                                      {
                                        if (options[element] === undefined)
                                        {
                                          throw element + ' is not a valid CvsPhylotree option';
                                        }
                                        else
                                        {
                                          options[element] = _options[element];
                                        }
                                      });
      }
    }

    var adjustSize = function()
    {
      var canvas_width = parentDiv.clientWidth;

      // For some mysterious reason if we reduce or remove the 4 pixel
      // reduction in height vertical scroll bars will appear on a page that
      // uses 100% vertical space. Hence we reduce canvas heights by 4 pixels.
      canvasElement.width   = canvas_width;
      canvasElement.height  = parentDiv.clientHeight - 4;

      scrollElement.width   = scroll_open_width - 4;
      scrollElement.height  = parentDiv.clientHeight;

      client_pos            = gxClientPosInPage(canvasElement);
    };

    adjustSize();

    // initialise tree depth and parent references
    var initTree = function(root_node)
    {
      var max_depth = 0;

      function recurse(node, depth)
      {
        node.depth = depth;

        if (max_depth < depth)
        {
          max_depth = depth;
        }

        if (node.children)
        {
          for (var cn = 0 ; cn < node.children.length ; cn++)
          {
            var d = recurse(node.children[cn], depth + 1);

            d.parent = node;
          }
        }

        return node;
      }

      recurse(root_node, 0);

      root_node.max_depth = max_depth;
    };

    // Instantiate private members
    var parsed_tree             = null,
        tree_root               = null,
        last_tree_root          = [],
        last_tree_scroll        = [],
        thumb_image             = undefined,
        node_span               = 1.0,
        mouse_filter            = null,
        options                 = {
                                    'show-ruler': true,
                                    'align-tips': true,
                                    'node-circle-size': 3,
                                    'node-width': 0.5,
                                    'node-colour': 'black',
                                    'node-fill-colour': 'lightgrey',
                                    'labelled-node-fill-colour': 'yellow',
                                    'node-highlight-colour': 'blue',
                                    'branch-width': 1,
                                    'branch-colour': 'grey',
                                    'clade-line-colour': 'green',
                                    'clade-fill-colour': 'lightgreen',
                                    'extension-width': 0.5,
                                    'species-colour':'darkblue',
                                    'ruler-width': 0.5,
                                    'ruler-colour': 'black',
                                    'scroll-background-colour': 'rgba(225,225,255,0.9)',
                                    'scroll-thumb-line-colour': 'rgba(64,64,255,0.5)',
                                    'scroll-thumb-fill-colour': 'rgba(64,64,255,0.2)',
                                    'ruler-tick-size': 5,
                                    'label-char-limit':48,
                                    'padding-top':0,
                                    'font-face':'arial',
                                    'line-size':15,
                                    'font-size':12
                                  },
        hit_map                 = gxHitMap(),
        menu_just_displayed     = false,
        menu_shown              = false,
        highlight_node          = undefined,
        kill_context_menu       = false,
        restore_image           = gxImageSnapshot(),
        xCollapseRange          = 0.0,
        xRange                  = 0.0,
        yRange                  = [0.0, 0.0],
        size                    = [1, 1],
        scale                   = [1, 1],
        offset                  = [0, 0],
        draw_range              = [0, 0],
        visible_range           = [0, 0],
        scroll_scale            = [1, 1],
        scroll_offset           = [0, 0],
        scroll_thumb            = [0, 0],
        scroll_origin           = 0.0,
        scroll_pos              = 0.0,
        scroll_range            = 0.0,
        scroll_drag             = false,
        scroll_open             = false,
        shown_font_size         = 12,
        vertical_margin         = options['font-size'] / 2,
        container_id            = _container_id,
        label_char_width        = 0,
        ruler_renderer          = undefined,
        client_pos              = gxClientPosInPage(canvasElement),
        context_menu_callbacks  = gxCallbackInstance(),
        view_changed_callbacks  = gxCallbackInstance(),
        view_changed_data       = {},

        nodeVisible     = function(node)
                          {
                            return !(node.hidden || node.notshown || false);
                          },

        nodeNotShown    = function(node)
                          {
                            return node.notshown;
                          },

        isLeafNode      = function(node)
                          {
                            return !(node.children && node.children.length);
                          },

        isNodeCollapsed = function(node)
                          {
                            return node.collapsed || false;
                          },

        rulerHeight = function()
        {
          return (options['show-ruler'] ? 2 * vertical_margin + ruler_renderer.height() : vertical_margin);
        },

        forEachNode = function(root_node, callback)
        {
          function recurse(node, callback)
          {
            callback(node);

            if (node.children)
            {
              for (var cn = 0 ; cn < node.children.length ; cn++)
              {
                recurse(node.children[cn], callback);
              }
            }
          }

          recurse(root_node, callback);
        },

        labelCharWidth =  function(tree_root)
                          {
                            var width = 0;

                            forEachNode(tree_root,
                                        function(node)
                                        {
                                          if (nodeVisible(node))
                                          {
                                            var node_width;
                                            var name = parsed_tree.name_map[node.name_index];

                                            if (name.length > 0 && node.children && node.children.length)
                                            {
                                              name = node.species_count + ", " + name;
                                            }

                                            node_width = name.length;
                                            width      = Math.max(node_width, width);
                                          }
                                        });

                            return width;
                          },

        charWidthToPixelWidth = function(nchar_width, rfont_size)
        {
          var width = Math.ceil(nchar_width * gxAvgCharWidth(canvasElement, rfont_size + 'px ' + options['font-face']));

          return (width);
        };

    var notifyViewChanged = function(bInScroll)
    {
      view_changed_callbacks.invoke(view_changed_data, bInScroll);
    };

    var limitScrollPos = function(scroll_pos)
    {
      if (scroll_pos < 0)
      {
        scroll_pos = 0.0;
      }

      if (scroll_pos > xCollapseRange - visible_range[1])
      {
        scroll_pos = xCollapseRange - visible_range[1];
      }

      return (scroll_pos);
    };

    var updateScaling = function()
    {
      // Restrict minimum range so that a useful ruler can be drawn.
      if ((yRange[0] > 0) && ((yRange[1] / yRange[0]) < 1.2))
      {
        yRange[0] = yRange[1] / 1.2;
      }

      // Determine scaling factors
      offset[0] = options['padding-top'] + rulerHeight() + 0.5;
      offset[1] = scroll_close_width + Math.max(options['font-size'], options['node-circle-size'] * 2);

      visible_range[0] = 0;
      visible_range[1] = Math.min((canvasElement.height - offset[0] - vertical_margin) / options['line-size'], xCollapseRange);

      draw_range[0] = offset[0];
      draw_range[1] = canvasElement.height;

      scroll_range = xCollapseRange - visible_range[1];

      size[0]  = canvasElement.height - offset[0] - vertical_margin;
      scale[0] = options['line-size'];

      shown_font_size = Math.min(options['font-size'], scale[0]);
      label_width     = charWidthToPixelWidth(label_char_width + 2, shown_font_size);

      size[1]     = canvasElement.width - label_width - offset[1];
      scale[1]    = size[1] / (yRange[1] - yRange[0]);
      scroll_pos  = limitScrollPos(scroll_pos);

      // Determine scaling factors for scroll thumbnail
      scroll_scale[0]   = scrollElement.height / xCollapseRange;
      scroll_scale[1]   = (scrollElement.width - scroll_close_width) / yRange[1];
      scroll_offset[0]  = 0;
      scroll_offset[1]  = scroll_close_width;
      scroll_thumb[0]   = scroll_scale[0] * scroll_pos + scroll_offset[0];
      scroll_thumb[1]   = scroll_scale[0] * visible_range[1] + scroll_thumb[0];

      ruler_renderer.range(yRange[1], yRange[0], size[1]);
    };

    var setClip = function(ctx, right, bottom)
    {
      ctx.rect(offset[1] - options['node-circle-size'] * 1.5 - 1, offset[0], right, bottom);
      ctx.clip();
    };

    var updateLayout = function(root_node)
    {
      var x = 0.5;

      var updateLayoutInner = function(node)
                              {
                                node.x = undefined;

                                if (nodeVisible(node))
                                {
                                  if (isLeafNode(node))
                                  {
                                    x     += node_span;
                                    node.x = x;
                                  }
                                  else
                                  {
                                    if (isNodeCollapsed(node))
                                    {
                                      x      += node_span;
                                      node.x  = x;
                                    }
                                    else
                                    {
                                      var ncount = 0;
                                      var bexit  = false;

                                      node.x = 0.0;

                                      for (var cn = 0 ; (cn < node.children.length) && !bexit ; cn++)
                                      {
                                        var node_x = updateLayoutInner(node.children[cn]);

                                        if (typeof node_x == "number")
                                        {
                                          node.x += node_x;
                                          ncount++;
                                        }
                                      }

                                      if (ncount === 0)
                                      {
                                        node.notshown = true;
                                        node.x        = undefined;
                                      }
                                      else
                                      {
                                        node.x /= ncount;
                                      }
                                    }
                                  }
                                }

                                return (node.x);
                              };

      updateLayoutInner(root_node);

      xCollapseRange = x;
      client_pos     = gxClientPosInPage(canvasElement);
    };

    var draw = function(root_node, thumbnail_ctx)
    {
      var drawBranches  = function(ctx, node, scale, offset, thumbnail)
                        {
                          var x = 0.5;

                          var drawBranchesInner = function(ctx, node, scale, offset, thumbnail)
                                                  {
                                                    var update_x = (thumbnail === false);

                                                    if (update_x)
                                                    {
                                                      node.x = undefined;
                                                    }

                                                    if (nodeVisible(node))
                                                    {
                                                      if (isLeafNode(node))
                                                      {
                                                        if (update_x)
                                                        {
                                                          x     += node_span;
                                                          node.x = x;
                                                        }
                                                      }
                                                      else
                                                      {
                                                        if (isNodeCollapsed(node))
                                                        {
                                                          var height,node_y,node_x,node_xm,node_xM;

                                                          height  = node_span * 0.75;
                                                          node_y  = (node.y - yRange[0]) * scale[1] + offset[1];

                                                          if (update_x)
                                                          {
                                                            x      += node_span;
                                                            node.x  = x;
                                                          }

                                                          node_x  = node.x * scale[0] + offset[0];
                                                          node_xm = node_x - (height * scale[0] / 2);
                                                          node_xM = node_xm + height * scale[0];

                                                          if (((node_x >= draw_range[0]) && (node_x <= draw_range[1])) || thumbnail)
                                                          {
                                                            ctx.stroke();

                                                            ctx.strokeStyle = options['clade-line-colour'];

                                                            ctx.beginPath();

                                                            ctx.moveTo(node_y, node_xm);
                                                            ctx.lineTo((node.yRange[1] - yRange[0]) * scale[1] + offset[1], node_xm);
                                                            ctx.lineTo((node.yRange[0] - yRange[0]) * scale[1] + offset[1], node_xM);
                                                            ctx.lineTo(node_y, node_xM);
                                                            ctx.lineTo(node_y, node_xm);

                                                            ctx.fill();
                                                            ctx.stroke();

                                                            ctx.strokeStyle = options['branch-colour'];

                                                            ctx.beginPath();
                                                          }
                                                        }
                                                        else
                                                        {
                                                          var ncount = 0;

                                                          if (update_x)
                                                          {
                                                            node.x = 0.0;
                                                          }

                                                          for (var cn = 0 ; cn < node.children.length ; cn++)
                                                          {
                                                            var xval = drawBranchesInner(ctx, node.children[cn], scale, offset, thumbnail);

                                                            if (update_x && (typeof xval == "number"))
                                                            {
                                                              node.x += xval;
                                                              ncount++;
                                                            }
                                                          }

                                                          if (update_x)
                                                          {
                                                            if (ncount === 0)
                                                            {
                                                              node.notshown = true;
                                                              node.x        = undefined;
                                                            }
                                                            else
                                                            {
                                                              node.x /= ncount;
                                                            }
                                                          }

                                                          for (var cn = 0 ; cn < node.children.length ; cn++)
                                                          {
                                                            var child_node   = node.children[cn];
                                                            var node_x       = node.x * scale[0] + offset[0];
                                                            var child_node_x = child_node.x * scale[0] + offset[0];

                                                            if ((((node_x < draw_range[0]) && (child_node_x < draw_range[0])) ||
                                                                 ((node_x > draw_range[1]) && (child_node_x > draw_range[1]))) && !thumbnail)
                                                            {
                                                              // Do nothing
                                                            }
                                                            else
                                                            {
                                                              var node_y;

                                                              node_y = (node.y - yRange[0]) * scale[1] + offset[1];

                                                              // Draw branch
                                                              ctx.moveTo(node_y, node_x);
                                                              ctx.lineTo(node_y, child_node_x);
                                                              ctx.lineTo((child_node.y - yRange[0]) * scale[1] + offset[1], child_node_x);
                                                            }
                                                          }
                                                        }
                                                      }
                                                    }

                                                    return (node.x);
                                                  };

                          ctx.lineWidth   = options['branch-width'] * (thumbnail ? 0.2 : 1.0);
                          ctx.strokeStyle = options['branch-colour'];
                          ctx.fillStyle   = options['clade-fill-colour'];

                          ctx.beginPath();

                          drawBranchesInner(ctx, node, scale, offset, thumbnail);

                          ctx.stroke();

                          if (thumbnail === false)
                          {
                            xCollapseRange = x;
                          }
                        };

      var drawNodes = function(ctx, ctx_hit, node, scale, offset)
                      {
                        var drawNodesInner  = function(ctx, ctx_hit, node, scale, offset)
                                              {
                                                if (nodeVisible(node) && (scale[0] >= 1.0))
                                                {
                                                  if (!isLeafNode(node))
                                                  {
                                                    var node_x = node.x * scale[0] + offset[0];

                                                    if ((node_x >= draw_range[0]) && (node_x <= draw_range[1]))
                                                    {
                                                      var node_y = (node.y - yRange[0]) * scale[1] + offset[1];
                                                      var labelled_node = ((node.name_index !== undefined) && (node.name_index > 0));

                                                      if (labelled_node)
                                                      {
                                                        ctx.fillStyle = options['labelled-node-fill-colour'];
                                                      }

                                                      // draw node
                                                      ctx.beginPath();
                                                      ctx.arc(node_y, node_x, options['node-circle-size'], 0, 2 * Math.PI);
                                                      ctx.fill();
                                                      ctx.stroke();

                                                      var colour = hit_map.addObject(node);

                                                      ctx_hit.strokeStyle = colour;
                                                      ctx_hit.fillStyle   = colour;

                                                      ctx_hit.beginPath();
                                                      ctx_hit.arc(node_y, node_x, options['node-circle-size'], 0, 2 * Math.PI);
                                                      ctx_hit.fill();
                                                      ctx_hit.stroke();

                                                      if (labelled_node)
                                                      {
                                                        ctx.fillStyle = options['node-fill-colour'];
                                                      }
                                                    }

                                                    if (isNodeCollapsed(node))
                                                    {

                                                    }
                                                    else
                                                    {
                                                      for (var cn = 0 ; cn < node.children.length ; cn++)
                                                      {
                                                        drawNodesInner(ctx, ctx_hit, node.children[cn], scale, offset);
                                                      }
                                                    }
                                                  }
                                                }
                                              };

                        ctx.lineWidth     = options['node-width'];
                        ctx.strokeStyle   = options['node-colour'];
                        ctx.fillStyle     = options['node-fill-colour'];
                        ctx_hit.lineWidth = options['node-width'];

                        drawNodesInner(ctx, ctx_hit, node, scale, offset);
                      };

      var drawTerminalNodes = function(ctx, ctx_hit, node, scale, offset)
                              {
                                var drawTerminalNodesInner  = function(ctx, ctx_hit, node, scale, offset)
                                                              {
                                                                if (nodeVisible(node) && (scale[0] >= 1.0))
                                                                {
                                                                  if (isLeafNode(node))
                                                                  {
                                                                    var node_x = node.x * scale[0] + offset[0];

                                                                    if ((node_x >= draw_range[0]) && (node_x <= draw_range[1]))
                                                                    {
                                                                      var text_x = shown_font_size / 2 + (node.y - yRange[0]) * scale[1] + offset[1];

                                                                      if (options['align-tips'] === true)
                                                                      {
                                                                        // Draw extension
                                                                        ctx.beginPath();
                                                                        ctx.setLineDash([3, 3]);
                                                                        ctx.moveTo((node.y - yRange[0]) * scale[1] + offset[1], node_x);
                                                                        ctx.lineTo((yRange[1] - yRange[0]) * scale[1] + offset[1], node_x);
                                                                        ctx.stroke();
                                                                        ctx.setLineDash([0]);

                                                                        text_x += (yRange[1] - node.y) * scale[1];
                                                                      }

                                                                      // Draw species
                                                                      var name = parsed_tree.name_map[node.name_index];

                                                                      ctx.fillText(name, text_x, node_x);

                                                                      var tm = ctx.measureText(name);

                                                                      ctx_hit.fillStyle = hit_map.addObject(node);
                                                                      ctx_hit.fillRect(text_x, node_x - shown_font_size / 2, tm.width, shown_font_size);

                                                                      view_changed_data.nodes.push({"pos":node_x, "node":node});
                                                                    }
                                                                  }
                                                                  else
                                                                  {
                                                                    if (isNodeCollapsed(node))
                                                                    {
                                                                      var node_x = node.x * scale[0] + offset[0];

                                                                      if ((node_x >= draw_range[0]) && (node_x <= draw_range[1]))
                                                                      {
                                                                        var text_x = shown_font_size / 2 + (node.y - yRange[0]) * scale[1] + offset[1];

                                                                        if (options['align-tips'] === true)
                                                                        {
                                                                          text_x += (yRange[1] - node.y) * scale[1];
                                                                        }

                                                                        // Draw node label and species count
                                                                        var sText = node.species_count.toString();

                                                                        if ((node.name_index !== undefined) && (node.name_index > 0))
                                                                        {
                                                                          sText += ", " + parsed_tree.name_map[node.name_index];
                                                                        }

                                                                        ctx.fillStyle = options['clade-line-colour'];
                                                                        ctx.fillText(sText, text_x, node_x);
                                                                        ctx.fillStyle = options['species-colour'];

                                                                        view_changed_data.nodes.push({"pos":node_x, "node":node, "name":sText});
                                                                      }
                                                                    }
                                                                    else
                                                                    {
                                                                      for (var cn = 0 ; cn < node.children.length ; cn++)
                                                                      {
                                                                        drawTerminalNodesInner(ctx, ctx_hit, node.children[cn], scale, offset);
                                                                      }
                                                                    }
                                                                  }
                                                                }
                                                              };

                                ctx.font          = shown_font_size + 'px ' + options['font-face'];
                                ctx.fillStyle     = options['species-colour'];
                                ctx.textBaseline  = 'middle';
                                ctx.textAlign     = 'left';
                                ctx.lineWidth     = options['extension-width'];
                                ctx.strokeStyle   = options['node-colour'];

                                view_changed_data = {};

                                view_changed_data.size      = 1.0 * scale[0];
                                view_changed_data.name_map  = parsed_tree.name_map;
                                view_changed_data.nodes     = [];

                                drawTerminalNodesInner(ctx, ctx_hit, node, scale, offset);
                              };


      if (thumbnail_ctx === undefined)
      {
        var ctx             = canvasElement.getContext('2d');
        var ctx_hit         = hit_map.beginUpdate(canvasElement.width, canvasElement.height);
        var scrolled_offset = [offset[0] - scroll_pos * options['line-size'], offset[1]];

        ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

        if (options['show-ruler'])
        {
          ruler_renderer.render(ctx, offset[1] + 0.5, options['padding-top'] + rulerHeight() - vertical_margin);
        }

        ctx.save();
        ctx_hit.save();

        setClip(ctx, canvasElement.width, canvasElement.height);
        setClip(ctx_hit, canvasElement.width, canvasElement.height);

        drawBranches(ctx, root_node, scale, scrolled_offset, false);
        drawNodes(ctx, ctx_hit, root_node, scale, scrolled_offset);
        drawTerminalNodes(ctx, ctx_hit, root_node, scale, scrolled_offset);

        ctx.restore();
        ctx_hit.restore();

        hit_map.endUpdate();
      }
      else
      {
        thumbnail_ctx.clearRect(0, 0, scrollElement.width, scrollElement.height);

        thumbnail_ctx.fillStyle = options['scroll-background-colour'];

        thumbnail_ctx.fillRect(0, 0, scrollElement.width, scrollElement.height);

        drawBranches(thumbnail_ctx, root_node, scroll_scale, scroll_offset, true);
      }
    };

    var createThumbImage = function(root_node)
    {
      var canvasElement = document.createElement('canvas');

      canvasElement.width  = scroll_open_width;
      canvasElement.height = parentDiv.clientHeight - 4;
      ctx                  = canvasElement.getContext('2d');

      draw(root_node, ctx);

      thumb_image = ctx.getImageData(0, 0, canvasElement.width, canvasElement.height);
    };

    var drawScrollBar = function(shown)
    {
      var ctx = scrollElement.getContext('2d');

      if (shown)
      {
        var scroll_height = Math.max(scroll_thumb[1] - scroll_thumb[0], 1);
        ctx.putImageData(thumb_image, 0, 0);

        ctx.strokeStyle = options['scroll-thumb-line-colour'];
        ctx.fillStyle   = options['scroll-thumb-fill-colour'];

        ctx.beginPath();

        ctx.moveTo(0, scroll_thumb[0]);
        ctx.lineTo(scrollElement.width, scroll_thumb[0]);
        ctx.lineTo(scrollElement.width, scroll_thumb[1]);
        ctx.lineTo(0, scroll_thumb[1]);
        ctx.lineTo(0, scroll_thumb[0]);

        ctx.fill();
        ctx.stroke();
      }
      else
      {
        ctx.clearRect(0, 0, scrollElement.width, scrollElement.height);

        ctx.fillStyle = options['scroll-background-colour'];

        ctx.fillRect(0, 0, scrollElement.width, scrollElement.height);
      }
    };

    var drawHighlight = function(node)
    {
      if (highlight_node !== node)
      {
        var ctx = canvasElement.getContext('2d');

        highlight_node = node;

        ctx.save();
        setClip(ctx, canvasElement.width, canvasElement.height);
        restore_image.restore(ctx);

        if ((node !== undefined) && nodeVisible(node) && (scale[0] >= 1.0))
        {
          var scrolled_offset = [offset[0] - scroll_pos * options['line-size'], offset[1]];

          if (isLeafNode(node))
          {
            // Capture region around text then draw highlight box
            ctx.strokeStyle = options['node-highlight-colour'];
            ctx.lineWidth   = 1;

            var tm              = ctx.measureText(parsed_tree.name_map[node.name_index]);
            var node_y          = (options['align-tips'] === true) ? shown_font_size / 2 + (yRange[1] - yRange[0]) * scale[1] + scrolled_offset[1] : shown_font_size / 2 + (node.y - yRange[0]) * scale[1] + scrolled_offset[1];
            var node_x          = node.x * scale[0] + scrolled_offset[0];
            var highlight_rect  = gxRect(node_y, node_x - shown_font_size / 2, node_y + tm.width, node_x + shown_font_size / 2).expand(3);

            // Capture region around node then draw highlight node
            var extent = highlight_rect.copy().expand(3);

            restore_image.capture(ctx, extent);
            highlight_rect.drawRoundedRectangle(ctx, 3);
          }
          else
          {
            var radius = options['node-circle-size'] * 1.5;
            var colour = options['node-highlight-colour'];
            var node_x = node.x * scale[0] + scrolled_offset[0];
            var node_y = (node.y - yRange[0]) * scale[1] + scrolled_offset[1];
            var extra  = 3;

            // Capture region around node then draw highlight node
            var extent = gxRect(gxPt(node_y - radius - extra, node_x - radius - extra), gxPt(node_y + radius + extra, node_x + radius + extra));

            restore_image.capture(ctx, extent);

            ctx.strokeStyle = colour;
            ctx.fillStyle   = colour;

            ctx.beginPath();
            ctx.arc(node_y, node_x, radius, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
          }
        }

        ctx.restore();
      }
    };

    var scrollView = function(nframes)
    {
      if (tree_root !== null)
      {
        scroll_pos += nframes * (visible_range[1] - visible_range[0]);

        updateCanvas(false);
        notifyViewChanged(false);
      }
    };

    var scrollOpen = function()
    {
      if (tree_root !== null)
      {
        drawScrollBar(true);

        scrollOverlay.style.width = scroll_open_width + "px";
        scroll_open               = true;
      }
    };

    var scrollClose = function()
    {
      if (tree_root !== null)
      {
        drawScrollBar(false);

        scrollOverlay.style.width  = scroll_close_width + "px";
        scrollOverlay.style.cursor = "default";
        scroll_open                = false;
      }
    };

    var toggleNode = function(node)
    {
      // If node not leaf
      //   If node not collased, collapse.
      if (isLeafNode(node))
      {

      }
      else
      {
        var x_before = node.x;

        node.collapsed = node.collapsed ? false : true;

        if (hit_map !== undefined)
        {
          hit_map.clearHit();
        }

        drawHighlight(undefined);
        updateLayout(tree_root);

        scroll_pos += node.x - x_before;

        updateScaling();

        draw(tree_root);
        updateScaling();
        createThumbImage(tree_root);
        drawScrollBar(scroll_open);
        notifyViewChanged(false);
      }
    };

    // CvsPhylotree public methods
    var placeNodes = function()
    {
      var x = 0.5;

      function rangeAppend(range, val)
      {
        if (val[0] === undefined)
        {
          if (range[0] > val)
          {
            range[0] = val;
          }

          if (range[1] < val)
          {
            range[1] = val;
          }
        }
        else
        {
          if (range[0] > val[0])
          {
            range[0] = val[0];
          }

          if (range[1] < val[1])
          {
            range[1] = val[1];
          }
        }
      }

      function treeLayout(a_node, yRange, bInitRange = false)
      {
        if (nodeNotShown(a_node))
        {
          return undefined;
        }

        var is_leaf = isLeafNode(a_node);

        if (a_node['parent'])
        {
          a_node.y = a_node.branch_length;

          a_node.y += a_node.parent.y;
        }

        if (is_leaf)
        {
          var node_span = 1.0;

          x += node_span;

          if (bInitRange)
          {
            yRange[0] = a_node.y;
            yRange[1] = a_node.y;
          }
          else
          {
            rangeAppend(yRange, a_node.y);
          }

          a_node.parent.species_count++;
        }
        else
        {
          if (a_node.children !== undefined)
          {
            a_node.species_count  = 0;
            a_node.collapsed      = false;
            a_node.yRange         = [0, 0];

            for (var cn = 0 ; cn < a_node.children.length ; cn++)
            {
              treeLayout(a_node.children[cn], a_node.yRange, (cn === 0));

              if (a_node.children[cn].species_count !== undefined)
              {
                a_node.species_count += a_node.children[cn].species_count;
              }
            }

            if (a_node.yRange[0] > a_node.y)
            {
              a_node.yRange[0] = a_node.y;
            }

            if (bInitRange)
            {
              yRange[0] = a_node.yRange[0];
              yRange[1] = a_node.yRange[1];
            }
            else
            {
              rangeAppend(yRange, a_node.yRange);
            }
          }
        }
      }

      tree_root.y = 0.0;

      treeLayout(tree_root, yRange, true);

      xRange         = x;
      xCollapseRange = x;

      label_char_width = labelCharWidth(tree_root);

      var limit = options['label-char-limit'];

      if ((limit !== undefined) && (label_char_width > limit))
      {
        label_char_width = limit;
      }

      updateScaling();
    };

    var updateCanvas = function(bWithLayout)
    {
      if (bWithLayout)
      {
        updateLayout(tree_root);
      }

      updateScaling();
      draw(tree_root);
      createThumbImage(tree_root);

      if (scroll_open)
      {
        drawScrollBar(true);
      }
    };

    var createTreeDisplay = function(treeRoot, full = false)
    {
      tree_root = treeRoot;

      if (full)
      {
        initTree(tree_root);
        placeNodes();
      }

      updateScaling();
      draw(tree_root);
      updateScaling();
      createThumbImage(tree_root);
      drawScrollBar(tree_root);
      notifyViewChanged(false);
    };

    this.zoomTree = function(treeRoot)
    {
      if (treeRoot !== undefined)
      {
        last_tree_root.push(tree_root);
        last_tree_scroll.push(scroll_pos);

        scroll_pos = 0;
        yRange[0]  = treeRoot.yRange[0];
        yRange[1]  = treeRoot.yRange[1];

        label_char_width = labelCharWidth(treeRoot);

        createTreeDisplay(treeRoot);
      }
    };

    this.zoomLastTree = function()
    {
      var treeRoot;

      tree_root.collapsed = true;

      treeRoot   = last_tree_root.pop();
      scroll_pos = last_tree_scroll.pop();
      yRange[0]  = treeRoot.yRange[0];
      yRange[1]  = treeRoot.yRange[1];

      label_char_width = labelCharWidth(treeRoot);

      createTreeDisplay(treeRoot);
    };

    this.zoomFullTree = function()
    {
      last_tree_root    = [];
      last_tree_scroll  = [];

      scroll_pos = 0;
      yRange[0]  = parsed_tree.root.yRange[0];
      yRange[1]  = parsed_tree.root.yRange[1];

      label_char_width = labelCharWidth(parsed_tree.root);

      createTreeDisplay(parsed_tree.root);
      this.collapseAll(true);
    };

    this.hasLastZoom = function()
    {
      var hasZoom = last_tree_root.length > 0;

      return (hasZoom);
    };

    this.isFullTreeVisible = function()
    {
      var isFullTree = (tree_root === parsed_tree.root);

      return (isFullTree);
    };

    this.tree = function(nwk, filter_name_list, bootstrap_values)
    {
      parsed_tree = (typeof nwk == "string") ? parseNewickString(nwk, filter_name_list, bootstrap_values) : nwk;
      createTreeDisplay(parsed_tree.root, true);

      return (this);
    };

    this.forEachNameIndex = function(root_node, callbackFn)
    {
      if ((callbackFn !== undefined) && (typeof callbackFn === "function"))
      {
        forEachNode(root_node,
                    function(node)
                    {
                      if (isLeafNode(node))
                      {
                        callbackFn(node.name_index, parsed_tree.name_map);
                      }
                    });
      }
    };

    this.createTranslationLookup = function(to_name_array)
    {
      var lut           = new Array(parsed_tree.name_count + 1).fill(null);
      var name_to_index = {};

      Object.keys(parsed_tree.name_map).forEach(function(key)
                                                {
                                                  name_to_index[parsed_tree.name_map[key]] = parseInt(key);
                                                });

      if (to_name_array !== undefined)
      {
        for (var cn = 0 ; cn < to_name_array.length ; cn++)
        {
          var from_index = name_to_index[to_name_array[cn]];

          if (from_index >= 0)
          {
            lut[from_index] = cn;
          }
        }
      }

      return (lut);
    };

    this.minimumVerticalPadding = function(required_padding)
    {
      var min_padding     = rulerHeight();
      var current_padding = min_padding + options['padding-top'];

      if (current_padding < required_padding)
      {
        options['padding-top'] += required_padding - current_padding;
      }
      else if (required_padding > min_padding)
      {
        options['padding-top'] = required_padding - min_padding;
      }
    };

    this.collapseAll = function(bLabelledOnly = false, root_node = undefined)
    {
      if (root_node === undefined)
      {
        root_node = tree_root;
      }

      forEachNode(root_node,
                  function(node)
                  {
                    if (node.children && node.children.length)
                    {
                      if (bLabelledOnly)
                      {
                        if (parsed_tree.name_map[node.name_index].length > 0)
                        {
                          node.collapsed = true;
                        }
                      }
                      else
                      {
                        node.collapsed = true;
                      }
                    }
                  });

      updateCanvas(true);
      notifyViewChanged(false);

      return (this);
    };

    this.expandAll = function(bLabelledOnly = false, root_node = undefined)
    {
      if (root_node === undefined)
      {
        root_node = tree_root;
      }

      forEachNode(root_node,
                  function(node)
                  {
                    if (node.children && node.children.length)
                    {
                      if (bLabelledOnly)
                      {
                        if (parsed_tree.name_map[node.name_index].length > 0)
                        {
                          node.collapsed = false;
                        }
                      }
                      else
                      {
                        node.collapsed = false;
                      }
                    }
                  });

      updateCanvas(true);
      notifyViewChanged(false);

      return (this);
    };

    this.onResize = function()
    {
      if (tree_root != null)
      {
        adjustSize();
        updateCanvas(true);
        notifyViewChanged(false);
      }
    };

    this.parsedTree = function()
    {
      return (parsed_tree);
    };

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
                         throw element + ' is not a valid CvsPhylotree option';
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
          throw keys + ' is not a valid CvsPhylotree option';
        }
      }

      return result;
    };

    this.setOptions = function(_options, bUpdate = false)
    {
      mergeOptions(_options);

      vertical_margin = options['font-size'] / 2;

      ruler_renderer.setOptions({
                                  'axis-line-width': options['ruler-width'],
                                  'axis-line-colour': options['ruler-colour'],
                                  'axis-tick-size': options['ruler-tick-size'],
                                  'axis-font-face':options['font-face'],
                                  'axis-font-colour': options['ruler-colour'],
                                  'axis-font-size':options['font-size']
                                });

      if (bUpdate)
      {
        updateCanvas(false);
        notifyViewChanged(false);
      }
    };

    this.defaultContextMenuCallback = function(Node, event, bHide)
    {
      if (bHide)
      {
        $("#" + ContextId).attr("style", "position:absolute;left:0px;top:0px;display:none;");

        menu_shown = true;
      }
      else
      {
        // This method uses jQuery UI to implement the menu so you will need to
        // have jQuery to use it.
        var docExtent    = gxRect();
        var posX         = event.pageX + 5;
        var posY         = event.pageY + 5;
        var Context      = this;
        var zoomLastHTML = this.hasLastZoom() ? "<li>" +
                                                    "<div>Zoom Last</div>" +
                                                "</li>"
                                              : "";
        var zoomAllHTML  = "<li>" +
                             "<div>Zoom All</div>" +
                           "</li>";

        var menuHTML = "<ul id='" + MenuId + "'>" +
                       "<li>" +
                         "<div>Expand All</div>" +
                       "</li>" +
                       "<li>" +
                         "<div>Expand All Labelled</div>" +
                       "</li>" +
                       "<li>" +
                         "<div>Collapse All</div>" +
                       "</li>" +
                       "<li>" +
                         "<div>Collapse All Labelled</div>" +
                       "</li>" +
                       "<li>" +
                         "<div>-</div>" +
                       "</li>" +
                       "<li>" +
                          "<div>Zoom</div>" +
                       "</li>" +
                         zoomLastHTML +
                         zoomAllHTML +
                       "</ul>";

        $("#" + ContextId).html(menuHTML);

        $("#" + MenuId).menu({select: function(jEvent, ui)
                                         {
                                           var id = ui.item.text();

                                           if (id ==="Expand All")
                                           {
                                             Context.expandAll(false, Node);
                                           }
                                           else if (id ==="Expand All Labelled")
                                           {
                                             Context.expandAll(true, Node);
                                           }
                                           else if (id ==="Collapse All")
                                           {
                                             Context.collapseAll(false, Node);
                                           }
                                           else if (id ==="Collapse All Labelled")
                                           {
                                             Context.collapseAll(true, Node);
                                           }
                                           else if (id ==="Zoom")
                                           {
                                             Context.zoomTree(Node);
                                           }
                                           else if (id ==="Zoom Last")
                                           {
                                             Context.zoomLastTree();
                                           }
                                           else if (id ==="Zoom All")
                                           {
                                             Context.zoomFullTree();
                                           }

                                           // Hide menu
                                           $("#" + ContextId).attr("style", "position:absolute;left:0px;top:0px;display:none;");

                                           menu_shown = false;
                                         }});

        // Show menu
        var pos    = $("#" + ContextId).attr("style", "position:absolute;left:" + posX + "px;top:" + posY + "px;display:block;").position();
        var height = $("#" + ContextId).outerHeight();

        // Adjust pos if off screen
        docExtent.screenExtent(document.documentElement);

        if (docExtent.br.y < pos.top + height)
        {
          posY -= pos.top + height - docExtent.br.y;

          $("#" + ContextId).attr("style", "position:absolute;left:" + posX + "px;top:" + posY + "px;display:block;");
        }

        menu_shown = true;
      }
    }

    this.addViewChangedCallback = function(callbackFn)
    {
      view_changed_callbacks.addCallback(this, callbackFn);
    };

    this.removeViewChangedCallback = function(callbackFn)
    {
      view_changed_callbacks.removeCallback(this, callbackFn);
    };

    this.addContextMenuCallback = function(callbackFn)
    {
      context_menu_callbacks.addCallback(this, callbackFn);
    };

    this.removeContextMenuCallback = function(callbackFn)
    {
      context_menu_callbacks.removeCallback(this, callbackFn);
    };

    this.saveImage = function(filename)
    {
      var link = document.createElement('a');

      link.href     = canvasElement.toDataURL("image/png").replace("image/png", "image/octet-stream");
      link.download = filename + ".png";

      var event = new MouseEvent('click');

      link.dispatchEvent(event);
    };

    // Add event handlers
    var contextMenuHandler  = function(event)
                              {
                                if (kill_context_menu)
                                {
                                  event.preventDefault();
                                  event.stopPropagation();
                                }
                              };

    var mouseUpHandler      = function(event)
                              {
                                kill_context_menu   = false;
                                menu_just_displayed = false;

                                if (!scroll_drag)
                                {
                                  if (hit_map !== undefined)
                                  {
                                    var Obj = hit_map.hitObject();

                                    if (Obj !== undefined)
                                    {
                                      if (event.button === 2)
                                      {
                                        menu_just_displayed = true;

                                        context_menu_callbacks.invoke(Obj, event, false);
                                      }
                                      else
                                      {
                                        toggleNode(Obj);
                                      }

                                      kill_context_menu = true;
                                    }
                                  }
                                }
                              };

    var mouseDownHandler    = function(event)
                              {

                              };

    var mouseMoveHandler    = function(event)
                              {
                                if (!scroll_drag)
                                {
                                  var x = event.pageX - client_pos.x;
                                  var y = event.pageY - client_pos.y;

                                  if (hit_map !== undefined)
                                  {
                                    var Obj = hit_map.testHit(x, y);

                                    drawHighlight(Obj);
                                  }
                                }
                              };

    var mouseLeaveHandler   = function(event)
                              {
                                if (!scroll_drag)
                                {
                                  if (hit_map !== undefined)
                                  {
                                    hit_map.clearHit();
                                  }

                                  drawHighlight(undefined);
                                }
                              };

    var mouseWheelHandler   = function(event)
                              {
                                var drag_delta      = mouse_filter.scrollBy(event);
                                var new_scroll_pos  = limitScrollPos(scroll_pos + drag_delta);

                                if (new_scroll_pos !== scroll_pos)
                                {
                                  scroll_pos      = new_scroll_pos;
                                  scroll_thumb[0] = scroll_scale[0] * scroll_pos + scroll_offset[0];
                                  scroll_thumb[1] = scroll_thumb[0] + scroll_scale[0] * visible_range[1];

                                  drawHighlight(undefined);
                                  draw(tree_root);
                                  drawScrollBar(true);
                                  notifyViewChanged(true);
                                }

                                event.preventDefault();
                              };

    var killMenuHandler     = function(event)
                              {
                                if (menu_just_displayed)
                                {
                                  menu_just_displayed = false;
                                }
                                else if (menu_shown)
                                {
                                  context_menu_callbacks.invoke(null, event, true);
                                }
                              };

    var scrollMouseUpHandler    = function(event, bFromScroller)
                                  {
                                    if (scroll_drag && !bFromScroller)
                                    {
                                      scroll_drag = false;

                                      var Extent = gxRect();

                                      Extent.screenExtent(scrollOverlay);

                                      if (!Extent.contains(event.pageX, event.pageY))
                                      {
                                        scrollClose();
                                      }

                                      notifyViewChanged(false);
                                    }
                                    else if (bFromScroller)
                                    {
                                      var y = event.pageY - event.target.offsetTop;

                                      if (y < scroll_thumb[0])
                                      {
                                        // Move scroll up one frame
                                        scrollView(-1);
                                      }

                                      if (y > scroll_thumb[1])
                                      {
                                        // Move scroll down one frame
                                        scrollView(1);
                                      }
                                    }
                                  };

    var scrollMouseDownHandler  = function(event)
                                  {
                                    if (!scroll_drag)
                                    {
                                      var y = event.pageY;

                                      scroll_drag   = true;
                                      scroll_origin = scroll_thumb[0];
                                      drag_root     = y;
                                    }
                                  };

    var scrollMouseMoveHandler  = function(event, bFromScroller)
                                  {
                                    if (scroll_drag && !bFromScroller)
                                    {
                                      var y               = event.pageY;
                                      var drag_delta      = y - drag_root;
                                      var new_scroll_pos  = limitScrollPos((scroll_origin + drag_delta) / scroll_scale[0]);

                                      if (new_scroll_pos !== scroll_pos)
                                      {
                                        scroll_pos      = new_scroll_pos;
                                        scroll_thumb[0] = scroll_scale[0] * scroll_pos + scroll_offset[0];
                                        scroll_thumb[1] = scroll_thumb[0] + scroll_scale[0] * visible_range[1];

                                        draw(tree_root);
                                        drawScrollBar(true);
                                        notifyViewChanged(true);
                                      }
                                    }
                                    else if (bFromScroller)
                                    {
                                      var y = event.pageY - client_pos.y;

                                      if ((y >= scroll_thumb[0]) && (y <= scroll_thumb[1]))
                                      {
                                        scrollOverlay.style.cursor = "ns-resize";
                                      }
                                      else
                                      {
                                        scrollOverlay.style.cursor = "default";
                                      }
                                    }
                                  };

    var scrollMouseLeaveHandler = function(event)
                                  {
                                    if (!scroll_drag)
                                    {
                                      scrollClose();
                                    }
                                  };

    var scrollMouseEnterHandler = function(event)
                                  {
                                    if (!scroll_drag)
                                    {
                                      scrollOpen();
                                    }
                                  };

    ruler_renderer = gxAxisRenderer(0, 0, 1, 1.0, 0.0, 1.0);
    this.setOptions(_options, false);

    canvasElement.addEventListener("contextmenu", contextMenuHandler);
    canvasElement.addEventListener("mouseup", mouseUpHandler);
    canvasElement.addEventListener("mousedown", mouseDownHandler);
    canvasElement.addEventListener("mousemove", mouseMoveHandler);
    canvasElement.addEventListener("mouseleave", mouseLeaveHandler);

    if ("onwheel" in document.createElement("div"))
    {
      mouse_filter = gxMouseWheelFilter(canvasElement);

      canvasElement.addEventListener("wheel", mouseWheelHandler);
    }

    document.addEventListener("keydown", killMenuHandler);
    document.addEventListener("mouseup", killMenuHandler);

    document.addEventListener("mouseup", function(event) {scrollMouseUpHandler(event, false);});
    document.addEventListener("mousemove", function(event) {scrollMouseMoveHandler(event, false);});
    scrollOverlay.addEventListener("mouseup", function(event) {scrollMouseUpHandler(event, true);});
    scrollOverlay.addEventListener("mousemove", function(event) {scrollMouseMoveHandler(event, true);});

    scrollOverlay.addEventListener("mousedown", scrollMouseDownHandler);
    scrollOverlay.addEventListener("mouseenter", scrollMouseEnterHandler);
    scrollOverlay.addEventListener("mouseleave", scrollMouseLeaveHandler);
  }

  var Obj = new Phylotree(_container_id, _options);

  return (Obj);
}

// ----------------------------------------------------------------------------

function CvsHeatmap(_container_id, _options = undefined)
{
  function Heatmap(_container_id, _options)
  {
    var parentDiv   = document.getElementById(_container_id);
    var CanvasId    = _container_id + "-heatmap";
    var DialogId    = _container_id + "-heatmap-context-dlg";
    var SelectionId = _container_id + "-heatmap-selection-dlg";
    var ColourKeyId = _container_id + "-key";
    var SizerId     = _container_id + "-sizer";
    var ScrollerId  = _container_id + "-scroll";

    parentDiv.innerHTML   = "<div id=" + SizerId + " style='width:100%;height:100%;position:relative;'><div><canvas id='" + CanvasId + "'>You will need a browser that supports canvas to display heat maps.</canvas><div id='" + ScrollerId + "' style='width:100%;overflow-x:auto;'/></div></div><div id='" + ColourKeyId + "'></div></div><div id='" + DialogId + "'></div><div id='" + SelectionId + "'></div>";

    var canvasElement     = document.getElementById(CanvasId);
    var scrollElement     = document.getElementById(ScrollerId);
    var options           = {'empty-line-width':0.25,
                             'empty-line-colour':'lightgrey',
                             'init-scale':true,
                             'scale-options':{'scale-line-width': 0.5,
                                              'scale-line-colour': 'black',
                                              'scale-tick-size': 5,
                                              'scale-font-face': 'arial',
                                              'scale-font-colour': 'black',
                                              'scale-font-size': 12,
                                              'scale-map-definition': [[0.01, '#0000FF', true],[1.0, '#FF0000', false]],
                                              'scale-length': 400,
                                              'scale-margin': 10,
                                              'scale-islog': false},
                             'highlight-colour':'white',
                             'highlight-shadow-colour':'black',
                             'column-font-face':'arial',
                             'column-font-colour':'DarkSlateGrey',
                             'aggregate-mode':'sum',
                             'min-cell-width':10,
                             'info-style':"border:1px solid rgb(168,168,168);padding:0.5em;opacity:0.90;background:rgb(248,248,248);font:inherit;color:darkblue;"};
    var OTU_max           = 0;
    var max_chars         = 0;
    var vertical_padding  = 0;
    var OTU_data          = undefined;
    var Context_data      = undefined;
    var lut               = undefined;
    var restore_image     = gxImageSnapshot();
    var horizontal_margin = 0;
    var cell_width        = 0;
    var cell_height       = 0;
    var origin_x          = 0;
    var origin_y          = 0;
    var highlight_cx      = -1;
    var highlight_cy      = -1;
    var map_data          = [];
    var selected_cols     = [];
    var last_select_expr  = "";
    var instance          = this;
    var client_pos        = gxClientPosInPage(canvasElement);
    var colour_scale      = undefined;
    var sizer             = undefined;
    var contextInfoDiv    = document.createElement('div');
    var click_callbacks   = gxCallbackInstance();
    var scroll_sizes      = gxScrollSizes();

    var mergeOptions = function(_options)
    {
      if (_options !== undefined)
      {
        Object.keys(_options).forEach(function(element)
                                      {
                                        if (options[element] === undefined)
                                        {
                                          throw element + 'is not a valid CvsHeatmap option';
                                        }
                                        else
                                        {
                                          options[element] = _options[element];
                                        }
                                      });
      }
    }

    mergeOptions(_options);

    contextInfoDiv.style.cssText = 'position:absolute;top:0;left:0;visibility:hidden;white-space:nowrap;' + options['info-style'];

    document.body.appendChild(contextInfoDiv);

    var adjustSize = function()
    {
      canvasElement.width   = canvasElement.parentElement.clientWidth;
      canvasElement.height  = canvasElement.parentElement.clientHeight - 4;
      client_pos            = gxClientPosInPage(canvasElement);
    };

    var updateCellSize = function(phylotreeObj)
    {
      var line_size, min_width;

      line_size = phylotreeObj.getOptions('line-size');

      adjustSize();

      min_width  = options['min-cell-width'];
      cell_width = canvasElement.width / (selected_cols.length + 1);

      if (cell_width < min_width)
      {
        cell_width = min_width;
      }
      else if (cell_width > 1.5 * line_size)
      {
        cell_width = 1.5 * line_size;
      }

      vertical_padding = Math.ceil((max_chars + 2) * gxAvgCharWidth(canvasElement, cell_width + 'px ' + options['column-font-face']));

      phylotreeObj.minimumVerticalPadding(vertical_padding);
    };

    var updateMaxChars = function()
    {
      max_chars = 0;

      for (var idx = 0 ; idx < selected_cols.length ; idx++)
      {
        var len;

        len       = (OTU_data.column_names[selected_cols[idx]]).length;
        max_chars = (max_chars > len) ? max_chars : len;
      }
    };

    var changeCallback = function(event, bInScroll)
    {
// Should make this exclusion based on speed of execution. If too slow then
// don't try and display otherwise do. Make it adaptive!
//      if (!bInScroll)
      {
        updateCellSize(this);

        if (lut !== undefined)
        {
          cell_height = event.size;
          map_data    = [];

          for (var cn = 0 ; cn < event.nodes.length ; cn++)
          {
            var node    = event.nodes[cn];
            var record  = {pos:node.pos, name_indices:[]};

            this.forEachNameIndex(node.node, function(index, map)
                                             {
                                               record.name_indices.push(lut[index]);
                                             });

            if (node.name !== undefined)
            {
              record['name'] = node.name;
            }

            map_data.push(record);
          }

          instance.updateMap();
        }
      }
    };

    var showContextInfo = function(cx, cy)
    {
      if (cx === undefined)
      {
        contextInfoDiv.style.top        = 0;
        contextInfoDiv.style.left       = 0;
        contextInfoDiv.style.visibility = 'hidden';
      }
      else
      {
        var species;
        var x = Math.floor(origin_x + horizontal_margin + cx * cell_width) + client_pos.x;
        var y = Math.floor(origin_y + (cy + 1.75) * cell_height) + client_pos.y;
        var docExtent     = gxRect();
        var contextExtent = gxRect();
        var bChanged      = false;

        docExtent.screenExtent(document.documentElement);

        contextInfoDiv.style.left       = x.toString() + 'px';
        contextInfoDiv.style.top        = y.toString() + 'px';
        contextInfoDiv.style.visibility = 'visible';

        if ((map_data[cy].name_indices.length > 1) && (map_data[cy].name !== undefined))
        {
          species = map_data[cy].name;
        }
        else
        {
          species = OTU_data.row_names[map_data[cy].name_indices[0]];
        }

        contextInfoDiv.innerHTML = "Species: " + species + "<BR>OTU: " + OTU_data.column_names[selected_cols[cx]] + "<BR>Value: " + map_data[cy].value[cx].toPrecision(4);

        x -= contextInfoDiv.offsetWidth / 2;

        contextInfoDiv.style.left = x.toString() + 'px';

        contextExtent.screenExtent(contextInfoDiv);

        if (contextExtent.br.x > docExtent.br.x - scroll_sizes.x)
        {
          x -= contextExtent.br.x - docExtent.br.x + scroll_sizes.x;

          bChanged = true;
        }

        if (contextExtent.tl.x < docExtent.tl.x - 1)
        {
          x += docExtent.tl.x - contextExtent.tl.x + 1;

          bChanged = true;
        }

        if (contextExtent.br.y > docExtent.br.y - scroll_sizes.y)
        {
          y -= Math.floor(2.5 * cell_height + contextExtent.height());

          bChanged = true;
        }

        if (bChanged)
        {
          contextInfoDiv.style.left = x.toString() + 'px';
          contextInfoDiv.style.top  = y.toString() + 'px';
        }
      }
    };

    var drawHighlight = function(x, y)
    {
      if (x === undefined)
      {
        var ctx = canvasElement.getContext('2d');

        restore_image.restore(ctx);
        showContextInfo(undefined);
      }
      else
      {
        var cx = Math.floor((x - horizontal_margin - origin_x) / cell_width);
        var cy = Math.floor((y - origin_y) / cell_height);

        if ((highlight_cx !== cx) || (highlight_cy !== cy))
        {
          var ctx = canvasElement.getContext('2d');

          highlight_cx = cx;
          highlight_cy = cy;

          restore_image.restore(ctx);

          if ((highlight_cx >= 0                  ) &&
              (highlight_cx < selected_cols.length))
          {
            var bShowInfo      = false;
            var x              = Math.floor(origin_x + horizontal_margin + cx * cell_width);
            var highlight_rect = undefined;
            var shadow_rect    = undefined;
            var offset         = gxPt(0.5, 0.5);

            if ((highlight_cy >= 0             ) &&
                (highlight_cy < map_data.length))
            {
              // Capture region around text then draw highlight box
              var y           = Math.floor(origin_y + cy * cell_height);
              highlight_rect  = gxRect(x, y, x + cell_width, y + cell_height).expand(3);
              bShowInfo       = true;
            }
            else if (highlight_cy < 0)
            {
              var ctx = canvasElement.getContext('2d');

              // Highlight the OTU column heading
              ctx.font = cell_width + 'px ' + options['column-font-face'];
              var size = ctx.measureText(OTU_data.column_names[selected_cols[cx]]);

              var y2          = vertical_padding - cell_height / 2;
              var y1          = y2 - size.width;
              highlight_rect  = gxRect(x, y1, x + cell_width, y2).expand(3);
            }

            if (highlight_rect !== undefined)
            {
              shadow_rect = highlight_rect.copy();

              // Capture region around node then draw highlight node
              var extent = highlight_rect.copy().expand(4);

              highlight_rect.sube(offset);
              shadow_rect.adde(offset);

              restore_image.capture(ctx, extent);

              ctx.strokeStyle = options['highlight-shadow-colour'];
              ctx.lineWidth   = 1;

              shadow_rect.drawRoundedRectangle(ctx, 3);

              ctx.strokeStyle = options['highlight-colour'];

              highlight_rect.drawRoundedRectangle(ctx, 3);
            }

            if (bShowInfo)
            {
              showContextInfo(highlight_cx, highlight_cy);
            }
            else
            {
              showContextInfo(undefined);
            }
          }
        }
      }
    };

    this.unRegisterData = function()
    {
      OTU_max           = 0;
      max_chars         = 0;
      vertical_padding  = 0;
      OTU_data          = undefined;
      Context_data      = undefined;
      lut               = undefined;
      cell_width        = 0;
      cell_height       = 0;
      origin_x          = 0;
      origin_y          = 0;
      highlight_cx      = -1;
      highlight_cy      = -1;
      map_data          = [];
      selected_cols     = [];
      last_select_expr  = "";
    };

    this.registerData = function(rOTU_data, rContext_data, phylotreeObj)
    {
      var cn;

      OTU_max           = 0;
      vertical_padding  = 0;
      OTU_data          = rOTU_data;
      Context_map       = {};

      for (cn = 0 ; cn < rContext_data.row_names.length ; cn++)
      {
        Context_map[rContext_data.row_names[cn]] = cn;
      }

      if (!OTU_data.column_names.every(function(element, index)
                                       {
                                         return (element in Context_map);
                                       }))
      {
        throw 'OTU_data refers to OTU not present in Context_data';
      }

      // Construct Context data that is ordered consitently with the OTU data
      Context_data      = {row_names:[],
                           key:rContext_data.key,
                           column_names:rContext_data.column_names.map(function(x) {return x;}),
                           data:[]};

      for (cn = 0 ; cn < OTU_data.column_names.length ; cn++)
      {
        var idx = Context_map[OTU_data.column_names[cn]];

        Context_data.row_names.push(OTU_data.column_names[cn]);
        Context_data.data.push(rContext_data.data[idx].map(function(x) {return x;}));
      }

      selected_cols = OTU_data.column_names.map(function(val, idx)
                                                {
                                                  return idx;
                                                });

      updateMaxChars();

      OTU_data.data.forEach(function(element)
                            {
                              OTU_max = element.reduce(function(acc, val)
                                                       {
                                                         return (acc < val) ? val : acc;
                                                       },
                                                       OTU_max);
                            });

      if ((colour_scale !== undefined) && (options['init-scale']))
      {
        if (OTU_max > 100.0)
        {
          options['scale-options']['scale-map-definition'] = [[0.01, '#000b88', true],[OTU_max, '#FFFF00', false]];
          options['scale-options']['scale-islog']          = true;
        }
        else
        {
          options['scale-options']['scale-map-definition'] = [[0.0, '#000b88', true],[100.0, '#FFFF00', false]];
          options['scale-options']['scale-islog']          = false;
        }

        colour_scale.setOptions(options['scale-options'], true);
      }

      if (phylotreeObj !== undefined)
      {
        updateCellSize(phylotreeObj);

        lut = phylotreeObj.createTranslationLookup(OTU_data.row_names);
        phylotreeObj.addViewChangedCallback(changeCallback);
      }

      return (this);
    };

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
                         throw element + ' is not a valid CvsHeatmap option';
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
          throw keys + ' is not a valid CvsHeatmap option';
        }
      }

      return result;
    };

    this.setOptions = function(_options, bUpdate = false)
    {
      mergeOptions(_options);

      if (bUpdate)
      {
        updateMap()
      }
    };

    this.maximum = function()
    {
      return (OTU_max);
    };

    this.updateMap = function()
    {
      var ctx = canvasElement.getContext('2d');

      ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

      if ((OTU_data              !== undefined) &&
          (OTU_data.data         !== undefined) &&
          (OTU_data.column_names !== undefined) &&
          (colour_scale          !== undefined) &&
          (OTU_data.column_names.length > 0))
      {
        var colour_map, do_sum, scroll_pos;

        min_width         = options['min-cell-width'];
        colour_map        = colour_scale.colourMap();
        do_sum            = (options['aggregate-mode'] === 'sum');
        cell_width        = canvasElement.width / (selected_cols.length + 1);

        if (cell_width < min_width)
        {
          var full_width;

          // make scrollable
          cell_width = min_width;
          full_width = cell_width * selected_cols.length + 1;

          scrollElement.innerHTML = "<div style='height:1px;width:" + full_width + "px'></div>";

          var extent = gxRect();

          extent.screenExtent(scrollElement);

          canvasElement.height    = canvasElement.parentElement.clientHeight - extent.height() - 4;
        }
        else if (cell_width > 1.5 * cell_height)
        {
          cell_width              = 1.5 * cell_height;
          scrollElement.innerHTML = "";
          canvasElement.height    = canvasElement.parentElement.clientHeight - 4;
        }
        else
        {
          scrollElement.innerHTML = "";
          canvasElement.height    = canvasElement.parentElement.clientHeight - 4;
        }

        scroll_pos        = scrollElement.scrollLeft;
        horizontal_margin = cell_width / 2 - scroll_pos;
        origin_x          = 0;
        origin_y          = map_data[0].pos - (cell_height / 2);

        map_data.forEach(function(element)
                         {
                           var cell_y = element.pos - (cell_height / 2);

                           element.value = new Array(selected_cols.length).fill(null);

                           for (var cn = 0 ; cn < selected_cols.length ; cn++)
                           {
                             var  cell_x = horizontal_margin + Math.floor(cn * cell_width);
                             var  width  = horizontal_margin + Math.floor((cn + 1) * cell_width) - cell_x;
                             var  sum    = element.name_indices.reduce(function(acc, val)
                                                                       {
                                                                         return (acc + OTU_data.data[val][selected_cols[cn]]);
                                                                       }, 0);

                             if (!do_sum)
                             {
                               sum /= element.name_indices.length;
                             }

                             element.value[cn] = sum;

                             if ((cell_x > -cell_width) && (cell_x < canvasElement.width + cell_width))
                             {
                               if (sum === 0)
                               {
                                 var mark_width    = width / 2;
                                 var mark_offset_x = mark_width / 2;
                                 var mark_height   = cell_height / 2;
                                 var mark_offset_y = mark_height / 2;

                                 ctx.strokeStyle = options['empty-line-colour'];
                                 ctx.lineWidth   = options['empty-line-width'];

                                 ctx.beginPath();
                                 ctx.moveTo(cell_x + mark_offset_x, cell_y + mark_offset_y);
                                 ctx.lineTo(cell_x + mark_offset_x + mark_width, cell_y + mark_offset_y + mark_height);
                                 ctx.moveTo(cell_x + mark_offset_x + mark_width, cell_y + mark_offset_y);
                                 ctx.lineTo(cell_x + mark_offset_x, cell_y + mark_offset_y + mark_height);
                                 ctx.stroke();
                               }
                               else
                               {
                                 var col = colour_map.map(sum);

                                 ctx.fillStyle = col;
                                 ctx.fillRect(cell_x, cell_y, width, cell_height);
                               }
                             }
                           }
                         });

        ctx.font          = cell_width + 'px ' + options['column-font-face'];
        ctx.textAlign     = 'right';
        ctx.textBaseline  = 'middle';
        ctx.fillStyle     = options['column-font-colour'];

        var text_y = vertical_padding - cell_height / 2;

        for (var cn = 0 ; cn < selected_cols.length ; cn++)
        {
          var text_x = horizontal_margin + Math.floor(cn * cell_width) + cell_width / 2;

          if ((text_x > -cell_width) && (text_x < canvasElement.width + cell_width))
          {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.translate(text_x, text_y);
            ctx.rotate(90 * Math.PI / 180);
            ctx.translate(-text_x, -text_y);

            ctx.fillText(OTU_data.column_names[selected_cols[cn]], text_x, text_y);
          }
        }

        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
    };

    this.saveImage = function(filename)
    {
      var link = document.createElement('a');

      link.href     = canvasElement.toDataURL("image/png").replace("image/png", "image/octet-stream");
      link.download = filename + ".png";

      var event = new MouseEvent('click');

      link.dispatchEvent(event);
    };

    this.onResize = function()
    {
      sizer.updateLayout();
      adjustSize();
      this.updateMap();
    };

    this.openSelection = function(phylotreeObj)
    {
      var cn;
      var max_width  = document.documentElement.clientWidth;
      var max_height = document.documentElement.clientHeight;

      var varListElement;
      var valListElement;
      var varAddElement;
      var valAddElement;
      var editorElement;
      var varListId   = SelectionId + "-var-list";
      var valListId   = SelectionId + "-val-list";
      var varAddId    = SelectionId + "-var-add";
      var valAddId    = SelectionId + "-val-add";
      var editorId    = SelectionId + "-editor";
      var errorId     = SelectionId + "-error";
      var list_length = (Context_data.column_names.length > 7) ? 7 : Context_data.column_names.length;
      var formHtml    = "<table><tbody><tr><td><select id='" + varListId + "' size='" + list_length + "'>";
      var col_map     = {};

      formHtml += "<option value='0'>" + Context_data.key + "</option>";

      for (cn = 1 ; cn < Context_data.column_names.length + 1 ; cn++)
      {
        formHtml += "<option value='" + cn + "'>" + Context_data.column_names[cn - 1] + "</option>";

        col_map[Context_data.column_names[cn]] = cn;
      }

      formHtml += "</select></td><td><button id='" + varAddId + "'>-></button></td><td rowspan='3'><textarea id='" + editorId + "' rows='" + (list_length + 3) + "' cols='50'></textarea></td></tr>" +
                  "<tr><td><select id='" + valListId + "' size='1'></select></td><td><button id='" + valAddId + "'>-></button></td></tr><tr><td>&nbsp</td><td></td></tr></tbody></table>" +
                  "<div id='" + errorId + "'></div>";

      var buildExpression = function()
      {
        var Ok         = true;
        var expression = editorElement.value;

        if (expression.length == 0)
        {
          selected_cols     = Context_data.row_names.map(function(val,idx) {return(idx);});
          last_select_expr  = expression;
        }
        else
        {
          var logical_operators = {"AND":"&&",
                                   "OR" :"||",
                                   "NOT":"!"};

          var relational_operators = {">" :">",
                                      ">=":">=",
                                      "<" :"<",
                                      "<=":"<=",
                                      "=" :"==",
                                      "!=":"!="};

          var space_regex       = /(\s+)/y;
          var logical_regex     = /(AND|OR|NOT)/iy;
          var relational_regex  = /(\>\=|\<\=|\!\=|\=|\>|\<)/y;
          var identifier_regex  = /([0-9,a-z,A-Z\?\~\!\@\#\$\%\^\&\*\_\.]+|\[.+?\])/y;
          var otu_name_regex    = new RegExp(Context_data.key, 'y');
          var is_number_regex   = /(is[ \t]+number)/y;
          var is_string_regex   = /(is[ \t]+string)/y;
          var in_regex          = /(in[ \t]*\(([^\)]+)\))/y;
          var comma_regex       = /(\,)/y;
          var string_regex      = /(\"[^\"]*?\"|\'[^\']*?\')/y;
          var number_regex      = /((?:(?:[0-9]+\.[0-9]*)|(?:\.[0-9]+)|(?:[0-9]+))(?:[eE][+-]?[0-9]+)?)/y;
          var open_brace_regex  = /(\()/y;
          var close_brace_regex = /(\))/y;
          var has_match         = true;
          var last_index        = 0;
          var scan_result       = {token:-1, match:null};

          function scan(expression, scan_result)
          {
            scan_result.token     = -1;
            scan_result.match     = null;
            space_regex.lastIndex = last_index;

            if ((scan_result.match = expression.match(space_regex)) != null)
            {
              last_index        = space_regex.lastIndex;
              scan_result.token = 0;
            }
            else
            {
              logical_regex.lastIndex = last_index;

              if ((scan_result.match = expression.match(logical_regex)) != null)
              {
                last_index        = logical_regex.lastIndex;
                scan_result.token = 1;
              }
              else
              {
                relational_regex.lastIndex = last_index;

                if ((scan_result.match = expression.match(relational_regex)) != null)
                {
                  last_index        = relational_regex.lastIndex;
                  scan_result.token = 2;
                }
                else
                {
                  string_regex.lastIndex = last_index;

                  if ((scan_result.match = expression.match(string_regex)) != null)
                  {
                    last_index        = string_regex.lastIndex;
                    scan_result.token = 4;
                  }
                  else
                  {
                    number_regex.lastIndex = last_index;

                    if ((scan_result.match = expression.match(number_regex)) != null)
                    {
                      last_index        = number_regex.lastIndex;
                      scan_result.token = 5;
                    }
                    else
                    {
                      in_regex.lastIndex = last_index;

                      if ((scan_result.match = expression.match(in_regex)) != null)
                      {
                        last_index        = in_regex.lastIndex;
                        scan_result.token = 11;
                      }
                      else
                      {
                        comma_regex.lastIndex = last_index;

                        if ((scan_result.match = expression.match(comma_regex)) != null)
                        {
                          last_index        = comma_regex.lastIndex;
                          scan_result.token = 10;
                        }
                        else
                        {
                          is_string_regex.lastIndex = last_index;

                          if ((scan_result.match = expression.match(is_string_regex)) != null)
                          {
                            last_index        = is_string_regex.lastIndex;
                            scan_result.token = 9;
                          }
                          else
                          {
                            is_number_regex.lastIndex = last_index;

                            if ((scan_result.match = expression.match(is_number_regex)) != null)
                            {
                              last_index        = is_number_regex.lastIndex;
                              scan_result.token = 8;
                            }
                            else
                            {
                              otu_name_regex.lastIndex = last_index;

                              if ((scan_result.match = expression.match(otu_name_regex)) != null)
                              {
                                last_index        = otu_name_regex.lastIndex;
                                scan_result.token = 12;
                              }
                              else
                              {
                                identifier_regex.lastIndex = last_index;

                                if ((scan_result.match = expression.match(identifier_regex)) != null)
                                {
                                  last_index        = identifier_regex.lastIndex;
                                  scan_result.token = 3;
                                }
                                else
                                {
                                  open_brace_regex.lastIndex = last_index;

                                  if ((scan_result.match = expression.match(open_brace_regex)) != null)
                                  {
                                    last_index        = open_brace_regex.lastIndex;
                                    scan_result.token = 6;
                                  }
                                  else
                                  {
                                    close_brace_regex.lastIndex = last_index;

                                    if ((scan_result.match = expression.match(close_brace_regex)) != null)
                                    {
                                      last_index        = close_brace_regex.lastIndex;
                                      scan_result.token = 7;
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }

            return (scan_result.token != -1);
          }

          var front_part,back_part;
          var insert_point    = -1;
          var java_expression = "var selected_cols = Context_data.data.map(function(data, idx) {return ((";

          while (Ok && scan(expression, scan_result))
          {
            switch (scan_result.token)
            {
              case 0:
                //whitespace
                java_expression += scan_result.match[0];
                break

              case 1:
                //logical operator
                java_expression += logical_operators[scan_result.match[0].toUpperCase()];
                insert_point     = -1;
                break;

              case 2:
                //relational operator
                java_expression += relational_operators[scan_result.match[0]];
                insert_point     = -1;
                break;

              case 3:
                //identifier
                var identifier = scan_result.match[0].replace(/[\[\]]*/g, '');

                if (identifier in col_map)
                {
                  insert_point     = java_expression.length;
                  java_expression += "data[" + col_map[identifier] + "]";
                }
                else
                {
                  // error condition
                  error_string = identifier + " is not a column of the context data table";
                  Ok           = false;
                }
                break;

              case 12:
                // otu name
                insert_point     = -1;
                java_expression += "Context_data.row_names[idx]";
                break;

              case 4:
                //string
                java_expression += scan_result.match[0];
                insert_point     = -1;
                break;

              case 5:
                //number
                java_expression += scan_result.match[0];
                insert_point     = -1;
                break;

              case 6:
                //left bace
                java_expression += scan_result.match[0];
                insert_point     = -1;
                break;

              case 7:
                //right bace
                java_expression += scan_result.match[0];
                insert_point     = -1;
                break;

              case 8:
                //is number type check
                if (insert_point >= 0)
                {
                  front_part      = java_expression.substr(0, insert_point);
                  back_part       = java_expression.substr(insert_point);
                  java_expression = front_part + " typeof " + back_part + "==='number' ";
                  insert_point    = -1;
                }
                else
                {
                  // error condition
                  error_string = "'is number' type check must follow a column name";
                  Ok           = false;
                }
                break;

              case 9:
                //is string type check
                if (insert_point >= 0)
                {
                  front_part      = java_expression.substr(0, insert_point);
                  back_part       = java_expression.substr(insert_point);
                  java_expression = front_part + " typeof " + back_part + "==='string' ";
                  insert_point    = -1;
                }
                else
                {
                  // error condition
                  error_string = "'is string' type check must follow a column name";
                  Ok           = false;
                }
                break;

              case 11:
                // in statement
                java_expression += " in {";

                var save_last = last_index;
                var in_list   = scan_result.match[2].concat("");

                last_index = 0;

                while (Ok && scan(in_list, scan_result))
                {
                  switch (scan_result.token)
                  {
                    case 0:
                      java_expression += scan_result.match[0];
                      break;

                    case 4:
                    case 5:
                      java_expression += scan_result.match[0] + ":0";
                      break;

                    case 10:
                      java_expression += scan_result.match[0];
                      break;

                    default:
                      error_string = "invalid token";
                      Ok           = false;
                      break;
                  }
                }

                java_expression += "} ";
                insert_point    = -1;
                last_index      = save_last;
                break;

              case 10:
                // Comma fall thru
              default:
                error_string = "invalid token";
                Ok           = false;
                break
            }
          }

          java_expression += ") ? idx : -1)}).filter(function(idx) {return idx >= 0;});";

          if (Ok)
          {
            try
            {
              var doSelection = new Function("Context_data", java_expression + "return selected_cols;");

              var selection = doSelection(Context_data);

              if (selection.length == 0)
              {
                error_string = "selection expression selects no records";
                Ok           = false;
              }
              else
              {
                selected_cols     = selection;
                last_select_expr  = editorElement.value;
              }
            }
            catch (ex)
            {
              error_string = "problem parsing selection expression. Exception thrown:<br>" + ex.message;
              Ok           = false;
            }
          }
        }

        return (Ok);
      };

      var selectOk = function()
      {
        if (buildExpression())
        {
          $("#" + SelectionId).dialog("close");

          // refresh the view
          updateMaxChars();
          updateCellSize(phylotreeObj);
          instance.onResize();
          phylotreeObj.onResize();
        }
        else
        {
          $("#" + errorId).html(error_string);
        }
      };

      var selectCancel = function()
      {
        $("#" + SelectionId).dialog("close");
      };

      var changeHandler = function(event)
      {
        var idx = event.currentTarget.selectedIndex;

        if (idx >= 0)
        {
          var cn;
          var listHtml = "";

          if (idx > 0)
          {
            var map      = {};

            for (cn = 0 ; cn < Context_data.row_names.length ; cn++)
            {
              map[Context_data.data[cn][idx - 1]] = 1;
            }

            cn = 0;

            Object.keys(map).forEach(function(element)
                                     {
                                       listHtml += "<option value='" + cn + "'>" + element + "</option>";
                                       cn++
                                     });
          }
          else
          {
            cn = 0;

            Context_data.row_names.forEach(function(element)
                                           {
                                             listHtml += "<option value='" + cn + "'>" + element + "</option>";
                                             cn++
                                           });
          }

          valListElement.innerHTML = listHtml;
        }
      };

      var addText = function(text, quote)
      {
        var is_number = function(string)
        {
          var result = string.match(/\s*(?:(?:[0-9]+\.[0-9]*)|(?:\.[0-9]+)|(?:[0-9]+))(?:[eE][+-]?[0-9]+)?\s*/);

          return ((result !== null) && (result.length > 0) && (result[0].length === string.length));
        }

        var start = editorElement.selectionStart;
        var end   = editorElement.selectionEnd;
        var value = editorElement.value;

        if (start > end)
        {
          var tmp = end;

          end   = start;
          start = tmp;
        }

        if (start >= 0)
        {
          var front = value.substr(0, start);
          var back  = value.substr(end, value.length - end);

          if (quote)
          {
            if (!is_number(text))
            {
              text = "'" + text + "'";
            }
          }
          else if (is_number(text) || (text.search(/\s/g) != -1))
          {
            text = "[" + text + "]";
          }

          editorElement.value          = front + text + back;
          editorElement.selectionStart = front.length + text.length;
          editorElement.selectionEnd   = editorElement.selectionStart;
        }
      };

      var addVarHandler = function(event)
      {
        var idx = varListElement.selectedIndex;

        if (idx >= 0)
        {
          if (idx > 0)
          {
            addText(Context_data.column_names[idx - 1], false);
          }
          else
          {
            addText(Context_data.key, false);
          }
        }
      };

      var addValHandler = function(event)
      {
        var idx = valListElement.selectedIndex;

        if (idx >= 0)
        {
          addText(valListElement.children[idx].innerHTML, true);
        }
      };

      $("#" + SelectionId).html(formHtml);

      varListElement = document.getElementById(varListId);
      valListElement = document.getElementById(valListId);
      varAddElement  = document.getElementById(varAddId);
      valAddElement  = document.getElementById(valAddId);
      editorElement  = document.getElementById(editorId);

      varListElement.addEventListener("change", changeHandler);
      varAddElement.addEventListener("click", addVarHandler);
      valAddElement.addEventListener("click", addValHandler);

      $("#" + SelectionId).dialog({
                                    closeText: "Close",
                                    height:"auto",
                                    width:"auto",
                                    maxHeight:max_height,
                                    maxWidth:max_width,
                                    draggable: true,
                                    title: "Open Selection",
                                    buttons: [
                                               {
                                                 text: "Ok",
                                                 click: selectOk
                                               },
                                               {
                                                 text: "Cancel",
                                                 click: selectCancel
                                               }
                                             ]
                                  });

      editorElement.value = last_select_expr;
    };

    this.addClickCallback = function(callbackFn)
    {
      click_callbacks.addCallback(this, callbackFn);
    };

    this.removeClickCallback = function(callbackFn)
    {
      click_callbacks.removeCallback(this, callbackFn);
    };

    this.defaultClickCallback = function(rMap_data, rOTU_data, rContext_data, highlight_cx, highlight_cy)
    {
      var formHtml = "";

      if (highlight_cy >= 0)
      {
        if ((rMap_data[highlight_cy].name_indices.length > 1) && (rMap_data[highlight_cy].name !== undefined))
        {
          species = rMap_data[highlight_cy].name;
        }
        else
        {
          species = rOTU_data.row_names[rMap_data[highlight_cy].name_indices[0]];
        }

        formHtml = "<table><tr><td>Species</td><td>" + species + "</td></tr><tr><td>Value</td><td>" + rMap_data[highlight_cy].value[highlight_cx].toPrecision(4) + "</td></tr></table><br>";
      }

      formHtml += "<table>";

      for (var cn = 0 ; cn < rContext_data.column_names.length ; cn++)
      {
        formHtml += "<tr><td>" + rContext_data.column_names[cn] + "</td><td>" + rContext_data.data[selected_cols[highlight_cx]][cn] + "</td></tr>";
      }

      formHtml += "</table>";

      var max_width  = document.documentElement.clientWidth;
      var max_height = document.documentElement.clientHeight;

      $("#" + DialogId).html(formHtml);
      $("#" + DialogId).dialog({
                                 closeText: "Close",
                                 height:"auto",
                                 width:"auto",
                                 maxHeight:max_height,
                                 maxWidth:max_width,
                                 draggable: true,
                                 title: "OTU Context Info"
                               });
    };

    // Add event handlers
    var mouseUpHandler      = function(event)
                              {
                                if ((OTU_data     !== undefined                 ) &&
                                    (highlight_cx >= 0                          ) &&
                                    (highlight_cx < OTU_data.column_names.length) &&
                                    (highlight_cy < map_data.length             ))
                                {
                                  click_callbacks.invoke(map_data, OTU_data, Context_data, highlight_cx, highlight_cy);
                                }
                              };

    var mouseDownHandler    = function(event)
                              {

                              };

    var mouseMoveHandler    = function(event)
                              {
                                var x = event.pageX - client_pos.x;
                                var y = event.pageY - client_pos.y;

                                drawHighlight(x, y);
                              };

    var mouseLeaveHandler   = function(event)
                              {
                                drawHighlight(undefined);
                              };

    var scrollHandler       = function(event)
                              {
                                instance.updateMap();
                              };

    var scaleChangedHandler = function()
                              {
                                instance.updateMap();
                              };

    canvasElement.addEventListener("mouseup", mouseUpHandler);
    canvasElement.addEventListener("mousedown", mouseDownHandler);
    canvasElement.addEventListener("mousemove", mouseMoveHandler);
    canvasElement.addEventListener("mouseleave", mouseLeaveHandler);
    scrollElement.addEventListener("scroll", scrollHandler);

    options['scale-options']['scale-dir'] = 1;

    colour_scale = gxColourScale(ColourKeyId, options['scale-options']);
    sizer        = gxSizer(SizerId, undefined, {"layout-plan":[[1,4],[0,2]],"layout-dir": 0});

    colour_scale.addChangedCallback(scaleChangedHandler);
    adjustSize();
  };

  var Obj = new Heatmap(_container_id, _options);

  return (Obj);
}

// ----------------------------------------------------------------------------

function otuParseTableCSV_or_TSV(input_string, just_column_names = false)
{
  // function to determine if the string represents a number or not
  var is_number = function(string)
  {
    var result = string.match(/\s*(?:(?:[0-9]+\.[0-9]*)|(?:\.[0-9]+)|(?:[0-9]+))(?:[eE][+-]?[0-9]+)?\s*/);

    return ((result !== null) && (result.length > 0) && (result[0].length === string.length));
  }

  // function to parse a tsv or csv line into an array of tokens. quotes are removed.
  var parse_line = function(string)
  {
    var idx,mode,append;
    var token  = "";
    var tokens = [];

    mode = 0;

    for (idx = 0 ; idx < string.length ; idx++)
    {
      var ch = string[idx];

      append = true;

      switch (ch)
      {
        case '\'':
          if (mode === 0)
          {
            mode   = 1;
            append = false;
          }
          else if (mode === 1)
          {
            mode   = 0;
            append = false;
          }
          break;

        case '"':
          if (mode === 0)
          {
            mode   = 2;
            append = false;
          }
          else if (mode === 2)
          {
            mode   = 0;
            append = false;
          }
          break;

        case ',':
          if (mode === 0)
          {
            tokens.push(token);
            token  = "";
            append = false;
          }
          break;

        case '\t':
          if (mode === 0)
          {
            tokens.push(token);
            token  = "";
            append = false;
          }
          break;

        case '\n':
        case '\r':
          append = false;
          break;

        default:
          break
      }

      if (append)
      {
        token += ch;
      }
    }

    if (token.length > 0)
    {
      tokens.push(token);
    }

    return (tokens);
  }

  var cn,line_count,line_length,line_number,line_match;
  var JSON_columns = "column_names:[";
  var JSON_data    = "";
  var regex        = /([^\n\r])*((\r\n)|(\n\r)|(\r)|(\n))/y;
  var result;

  line_count      = 0;
  regex.lastIndex = 0;

  while (regex.test(input_string))
  {
    line_count++;
  }

  regex.lastIndex = 0;
  line_number     = 0;

  while ((line_match = input_string.match(regex)) != null)
  {
    var line = line_match[0];

    if (line_number === 0)
    {
      var column_names = parse_line(line);

      for (cn = 0 ; cn < column_names.length ; cn++)
      {
        if (cn !== 0)
        {
          JSON_columns += ",";
        }

        JSON_columns += "'" + column_names[cn] + "'";
      }

      JSON_columns += "]";

      eval(just_column_names ? "result = {" + JSON_columns + "};" : "result = {" + JSON_columns + ",data:new Array(line_count - 1)};");
    }
    else
    {
      if (just_column_names)
      {
        break;
      }

      var row_data = parse_line(line);

      JSON_data = "[";

      for (cn = 0 ; cn < row_data.length ; cn++)
      {
        if (cn !== 0)
        {
          JSON_data += ",";
        }

        if (is_number(row_data[cn]))
        {
          JSON_data += row_data[cn];
        }
        else
        {
          JSON_data += "'" + row_data[cn] + "'";
        }
      }

      JSON_data += "]";

      eval("result.data[line_number - 1] = " + JSON_data + ";");
    }

    line_number++;
  }

  return (result);
}

// ----------------------------------------------------------------------------

function otuParseTransformTable(table, row_names_column)
{
  // Take the names in the data[][row_names_column] and make these the row_names.
  // delete the row_names_column from column names and delete the associated
  // data from data.
  if ((row_names_column < 0) || (row_names_column >= table.column_names.length))
  {
    throw 'row_names_column out of range';
  }

  table.key = table.column_names[row_names_column];

  table.column_names.splice(row_names_column, 1);

  table.row_names = new Array(table.data.length);

  for (cn = 0 ; cn < table.data.length ; cn++)
  {
    table.row_names[cn] = (table.data[cn][row_names_column]).toString();

    table.data[cn].splice(row_names_column, 1);
  }
}

// ----------------------------------------------------------------------------

function otuTreeOpen(_container_id)
{
  function TreeOpen(_container_id)
  {
    var parentDiv = document.getElementById(_container_id);
    var ButtonId  = _container_id + "-button";
    var DialogId  = _container_id + "-dlg";

    parentDiv.innerHTML     = "<button id='" + ButtonId + "'>Open...</button><div id='" + DialogId + "'></div>";

    var opened_callbacks    = gxCallbackInstance();
    var instance            = this;
    var OTU_ContextTable    = undefined;
    var OTU_DataTable       = undefined;
    var Tree                = undefined;
    var IsLoaded            = false;
    var FirstTime           = true;

    this.otuContextTable = function()
    {
      return (OTU_ContextTable);
    };

    this.otuDataTable = function()
    {
      return (OTU_DataTable);
    };

    this.tree = function()
    {
      return (Tree);
    };

    this.isLoaded = function()
    {
      return (IsLoaded);
    }

    this.open = function()
    {
      var WaitId                = DialogId + "_wait_dlg";
      var ErrorId               = DialogId + "_error_msg";
      var SelTreeFileId         = DialogId + "_sel_tree_file";
      var SelContextFileId      = DialogId + "_sel_Context_file";
      var SelDataFileId         = DialogId + "_sel_Data_file";
      var SelContextKeyId       = DialogId + "_sel_Context_key";
      var SelDataKeyId          = DialogId + "_sel_Data_key";
      var SelTreeFileObj        = undefined;
      var SelContextFileObj     = undefined;
      var SelDataFileObj        = undefined;
      var SelTreeFileName       = "";
      var SelContextFileName    = "";
      var SelDataFileName       = "";
      var SelTreeFileString     = "";
      var SelContextFileString  = "";
      var SelDataFileString     = "";
      var WaitCount             = 0;

      var readFile = function(blob, dataFn)
      {
        reader = new FileReader();

        reader.onabort  = function abortHandler(event)
                          {
                            WaitCount--;
                            dataFn("");
                          };

        reader.onerror  = function errorHandler(event)
                          {
                            WaitCount--;
                            dataFn("");

                            switch(event.target.error.code)
                            {
                              case event.target.error.NOT_FOUND_ERR:
                                alert('File Not Found!');
                                break;

                              case event.target.error.NOT_READABLE_ERR:
                                alert('File is not readable');
                                break;

                              case event.target.error.ABORT_ERR:
                                break; // noop

                              default:
                                alert('An error occurred reading this file.');
                            };
                          }

        reader.onload = function(event)
                        {
                          WaitCount--;
                          dataFn(event.target.result);
                        };

        WaitCount++;

        reader.readAsText(blob);
      }

      var initSelectionList = function(SelectId, DataString)
      {
        var Html = "";

        if (DataString.length > 0)
        {
          var cn, Selected;
          var Table = otuParseTableCSV_or_TSV(DataString, true);

          for (cn = 0 ; cn < Table.column_names.length ; cn++)
          {
            if (cn === 0)
            {
              Selected = "Selected";
            }
            else
            {
              Selected = "";
            }

            Html += "<option value='" + cn +  "' " + Selected + ">" + Table.column_names[cn] + "</option>";
          }
        }

        $("#" + SelectId).html(Html);
      };

      var treeFileSelected = function(event)
      {
        if (event.target.files.length > 0)
        {
          SelTreeFileName = event.target.files[0].name;
          readFile(event.target.files[0], function(data)
                                          {
                                            SelTreeFileString = data;
                                          });
        }
      };

      var contextFileSelected = function(event)
      {
        if (event.target.files.length > 0)
        {
          SelContextFileName = event.target.files[0].name;
          readFile(event.target.files[0], function(data)
                                          {
                                            SelContextFileString = data;

                                            initSelectionList(SelContextKeyId, SelContextFileString);
                                          });
        }
        else
        {
          initSelectionList(SelContextKeyId, "");
        }
      };

      var dataFileSelected = function(event)
      {
        if (event.target.files.length > 0)
        {
          SelDataFileName = event.target.files[0].name;
          readFile(event.target.files[0], function(data)
                                          {
                                            SelDataFileString = data;

                                            initSelectionList(SelDataKeyId, SelDataFileString);
                                          });
        }
        else
        {
          initSelectionList(SelDataKeyId, "");
        }
      };

      var initDialog = function()
      {
        var formHtml = "<table><tbody>" +
                       "<tr><th style='text-align:right'>Tree File</th><td><input type='file' id='" + SelTreeFileId + "'/></td></tr>" +
                       "<tr><th></th><th></th><th style='text-align:right'>Key Column</th></tr>" +
                       "<tr><th style='text-align:right'>OTU Context File</th><td><input type='file' id='" + SelContextFileId + "'/></td><td><select id='" + SelContextKeyId + "'></select></td></tr>" +
                       "<tr><th style='text-align:right'>OTU Data File</th><td><input type='file' id='" + SelDataFileId + "'/></td><td><select id='" + SelDataKeyId + "'></select></td></tr>" +
                       "</tbody></table>" +
                       "<div id='" + ErrorId + "'></div>" +
                       "<div id='" + WaitId + "'></div>";

        $("#" + DialogId).html(formHtml);

        SelTreeFileObj = document.getElementById(SelTreeFileId);
        SelTreeFileObj.addEventListener("change", treeFileSelected, false);

        SelContextFileObj = document.getElementById(SelContextFileId);
        SelContextFileObj.addEventListener("change", contextFileSelected, false);

        SelDataFileObj = document.getElementById(SelDataFileId);
        SelDataFileObj.addEventListener("change", dataFileSelected, false);

        $("#" + WaitId).html("<p>Loading in progress...</p>");
        $("#" + WaitId).dialog({
                                 autoOpen: false,
                                 closeOnEscape: false,
                                 closeText: "",
                                 modal:true,
                                 height:"auto",
                                 width:"auto",
                                 draggable: false,
                                 title: "Wait"
                               });
      };

      var readDialog = function()
      {
        var error_string;
        var is_ok = true;

        var SelContextKeyIdx = document.getElementById(SelContextKeyId).selectedIndex;
        var SelDataKeyIdx    = document.getElementById(SelDataKeyId).selectedIndex;

        if (SelTreeFileName.length === 0)
        {
          error_string = "No Newick tree file selected";
          is_ok        = false;
        }

        if (is_ok && (SelContextFileName.length === 0))
        {
          error_string = "No OTU context file selected";
          is_ok        = false;
        }

        if (is_ok && (SelDataFileName.length === 0))
        {
          error_string = "No OTU data file selected";
          is_ok        = false;
        }

        if (is_ok && SelTreeFileString.length === 0)
        {
          error_string = "Newick tree file empty or cannot open file";
          is_ok        = false;
        }

        if (is_ok && SelContextFileString.length === 0)
        {
          error_string = "OTU context file empty or cannot open file";
          is_ok        = false;
        }

        if (is_ok && SelDataFileString.length === 0)
        {
          error_string = "OTU data file empty or cannot open file";
          is_ok        = false;
        }

        var TmpOTU_ContextTable;
        var TmpOTU_DataTable;
        var TmpTree;

        if (is_ok)
        {
          var dlgElement = document.getElementById(DialogId);

          gxElementSetStyle(dlgElement, "cursor", "progress");

          try
          {
            TmpOTU_ContextTable = otuParseTableCSV_or_TSV(SelContextFileString);
            otuParseTransformTable(TmpOTU_ContextTable, SelContextKeyIdx);
          }
          catch (ex)
          {
            error_string = "problem parsing OTU context file. Exception thrown:<br>" + ex.message;
            is_ok        = false;
          }

          try
          {
            TmpOTU_DataTable = otuParseTableCSV_or_TSV(SelDataFileString);
            otuParseTransformTable(TmpOTU_DataTable, SelDataKeyIdx);
          }
          catch (ex)
          {
            error_string = "problem parsing OTU data file. Exception thrown:<br>" + ex.message;
            is_ok        = false;
          }

          if (is_ok && (TmpOTU_ContextTable.row_names.length !== TmpOTU_DataTable.column_names.length))
          {
            error_string = "OTU data file and OTU context file are inconsistent. Number of OTU's differ";
            is_ok        = false;
          }

          if (is_ok && !TmpOTU_ContextTable.row_names.every(function(element, index)
                                                            {
                                                              var bMatched = true;

                                                              if (element !== TmpOTU_DataTable.column_names[index])
                                                              {
                                                                bMatched  = false;
                                                              }

                                                              return bMatched;
                                                            }))
          {
            error_string = "data file and context file OTU names are inconsistent. They must have the same order.";
            is_ok        = false;
          }

          TmpTree = parseNewickString(SelTreeFileString, TmpOTU_DataTable.row_names);

          if (is_ok && (TmpTree.error !== null))
          {
            error_string = "problem parsing tree file:<br>" + TmpTree.error;
            is_ok        = false;
          }

          if (is_ok)
          {
            if (!("children" in TmpTree.root) || (TmpTree.root.children.length === 0))
            {
              error_string = "no common species between tree and OTU data";
              is_ok        = false;
            }
          }

          gxElementSetStyle(dlgElement, "cursor", "default");
        }

        if (is_ok)
        {
          OTU_ContextTable    = TmpOTU_ContextTable;
          OTU_DataTable       = TmpOTU_DataTable;
          Tree                = TmpTree;
          IsLoaded            = true;
        }
        else
        {
          $("#" + ErrorId).html(error_string);
        }

        return (is_ok);
      };

      var openOk = function(state)
      {
        if (WaitCount > 0)
        {
          // Need to wait until files are loaded.
          window.setTimeout(function()
                            {
                              openOk(state);
                            }, 100);
        }
        else
        {
          switch (state)
          {
            case 0:
            {
              $("#" + WaitId).dialog("open");

              // Need to wait to allow the UI to update. This ensures we get
              // visual feedback of the loading process which can be slow for
              // big data files.
              window.setTimeout(function()
                                {
                                  openOk(1);
                                }, 10);
              break;
            }

            case 1:
            {
              var bOk = readDialog();

              $("#" + WaitId).dialog("close");

              if (bOk)
              {
                $("#" + DialogId).dialog("close");

                opened_callbacks.invoke(Tree, OTU_DataTable, OTU_ContextTable);
              }
              break;
            }

            default:
            {
              throw "Invalid openOk() state"
              break;
            }
          }
        }
      };

      var openCancel = function()
      {
        $("#" + DialogId).dialog("close");
      };

      if (FirstTime)
      {
        var max_width  = document.documentElement.clientWidth;
        var max_height = document.documentElement.clientHeight;

        initDialog();

        $("#" + DialogId).dialog({
                                   closeText: "Close",
                                   modal:true,
                                   height:"auto",
                                   width:"auto",
                                   maxHeight:max_height,
                                   maxWidth:max_width,
                                   draggable: true,
                                   title: "Open Session",
                                   buttons: [
                                              {
                                                text: "Open",
                                                click: function() {openOk(0);}
                                              },
                                              {
                                                text: "Cancel",
                                                click: openCancel
                                              }
                                            ]
                                 });

        FirstTime = false;
      }
      else
      {
        $("#" + ErrorId).html("");
        $("#" + DialogId).dialog("open");
      }
    };

    this.addOpenedCallback = function(callbackFn)
    {
      opened_callbacks.addCallback(this, callbackFn);
    };

    this.removeOpenedCallback = function(callbackFn)
    {
      opened_callbacks.removeCallback(this, callbackFn);
    };

    $("#" + ButtonId).click(function()
                            {
                              instance.open();
                            });
  };

  var Obj = new TreeOpen(_container_id);

  return (Obj);
}
