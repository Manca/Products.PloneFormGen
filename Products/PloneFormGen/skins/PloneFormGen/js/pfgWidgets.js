var pfgWidgets;
// fieldset support for moving fields between them. Make the fieldsets behave like tabs.
(function($) {
	
pfgWidgets = {
	
	init: function() {
		var item, target, table = $("#pfg-qetable");
		var initPos, finalPos; // initial and final positions of element being sorted (dragged)
		var i = 0; // counter of newly added elements to the form
		
		$("div.qefield").each(function() {
			$(this).height($(this).height()); // workaround for children's height not being able to set using %s
			$(this).width($(this).width());  // the same for width, for the new ui-sortable-helper
		});

		table.sortable({
			start: function (event, ui) {
			   ui.placeholder.height(ui.item.height());
			   initPos = pfgWidgets.getPos(ui.item);
		    },			
			helper: 'clone',
			items: '.qefield',
		    handle: '> div.draggingHook',
			tolerance: 'pointer',
		    placeholder: 'placeholder',
//			containment: 'document',
		    update: function(e, ui) {
				if (ui.item.hasClass("new-widget")) {
					return;
				}
				if (ui.item.is("div.widget")) {
					// perform the operations on the newly dragged element from the widgets manager
					var item = ui.item;
					$(item).addClass("qechild");
					$(item).addClass("item_" + i);
					$(item).wrap("<div class='qefield new-widget'></div>"); // on the fly wrapping with necessary table elements
					$(item).before("<div class='draggable draggingHook editHook qechild'>⣿</div>");
					$("img.ajax-loader").css('visibility', 'visible');
					$(item).width($(item).width());
				//	$(item).height($(item).height());	
					// AJAX stuff
					$(item).children("div.widget-inside").load("createObject?type_name=" + $(item).attr("id") + " #content > div:last", function(response, status, xhr) {
						if (status=="error") {
							var msg = "Sorry but there was an error: ";
						    $(this).html(msg + xhr.status + " " + xhr.statusText);
						}
						else {
							$(this).find("legend").remove();
							$(this).find("#fieldset-overrides").remove();
							$(this).find(".formHelp").remove();
						}
						$("img.ajax-loader").css('visibility', 'hidden');
						// set the required attribute for the on the fly validation
						var inputElem = $(this).find("span.required").parent().find("input");
						var formElem = $(this).find('form');
						inputElem.attr({required: "required"});
						formElem.validator({
							messageClass: formElem.attr("id") + "_" + (i-1) +" error",
							position: "center right",
							offset: [-10, 3]
						}).submit(function(e) {
							var tmpArray = new Array();
							inputElem.each(function(i,v) {
							  if (!$(v).val())
								tmpArray.push($(v));
							});
							tmpArray[0].focus();
						});
						// hide all the error messages so far!
						if ($("div.error").length > 0) {
							$("div.error").hide();
						}
						$(this).slideDown();
						
					});
					
					// bind the toggle event for toggling slideUp/slideDown
					$(".qefield div.item_" + i +" .widget-header").toggle(
						function() {
							// hide all the error messages so far!
							if ($("div.error").length > 0) {
								$("div.error").hide();
							}
							// hide the error messages when manipulating with the widgets							
							$(this).siblings("div.widget-inside").slideUp();
							var getId = $(this).siblings("div.widget-inside").find("form").attr("id");
							var itemNo = $(this).parent().attr("class").substr($(this).parent().attr("class").indexOf("item") + "item_".length);
							$("div." + getId + "_" + itemNo).hide();
						},
						function() {
							// hide all the error messages so far!
							if ($("div.error").length > 0) {
								$("div.error").hide();
							}							
							$(this).siblings("div.widget-inside").slideDown();
						}
					);
					
					// current position in the table
					var currpos = $(".item_" + i).parent().index();
					
					$("#pfg-qetable [name=form.button.save]").click(function(e) {
				//	    e.preventDefault();
					    // on the fly addition of the field to the form - a lot of logic goes here!! TO DO
					});
					
					$("#pfg-qetable [name=form.button.cancel]").live('click', function(e) {
					  e.preventDefault();
						// hide all the error messages so far!
					  if ($("div.error").length > 0) {
					 	$("div.error").hide();
					  }
					  var widgetParent = $(this).parents("div.qefield");
					  widgetParent.find("div.widget-inside").slideUp('fast', function() {
					        widgetParent.fadeOut('slow', function() {
						  	widgetParent.remove();
						  });
					  });
					});
					
					i++; // increment i on each addition
				} 
				else {
					finalPos = pfgWidgets.getPos(ui.item);
					if (initPos > finalPos) { // we came from lower rows
						target = $(ui.item).next();
					}
					else { // we came from upper rows
						target = $(ui.item).prev();
					}
					if (target.find(".field").length !=0) {
						target = target.find(".field").attr('id').substr('folder-contents-item-'.length);
					}
					else if (target.find(".PFGFieldsetWidget").length !=0 ) {
						target = target.find(".PFGFieldsetWidget").attr('id').substr('pfg-fieldsetname-'.length);
					}
					
					if ($(ui.item).find(".field").length != 0) {
					  item = $(ui.item).find(".field").attr('id').substr('folder-contents-item-'.length);
					}
					else if ($(ui.item).find(".PFGFieldsetWidget").length !=0) {
					  item = $(ui.item).find(".PFGFieldsetWidget").attr('id').substr('pfg-fieldsetname-'.length);
					}
					pfgWidgets.updatePositionOnServer(item, target);
				}
			},
			out: function(e, ui) { 
		      if (!ui.helper) {
				return;
			  }
		
			  if (ui.helper.hasClass("widget") && (ui.helper.hasClass("w-field") || ui.helper.hasClass("w-action"))) {
			    return;
		      }
			  else {
				// hide all the error messages so far!
				if ($("div.error").length > 0) {
					$("div.error").hide();
				}						
				ui.helper.html(ui.helper.find("div.field label.formQuestion").text());
		    	ui.helper.wrapInner("<h4 class='widget-header-helper'></h4>");
		    	ui.helper.addClass("widget");
				ui.helper.removeClass("qefield");
				ui.helper.width("210px");
				ui.helper.height("32px");
				/*** let the helper follow the mouse! (w/o any offset between the cursor and the element) - sort: takes care of any mouse move, so this is not necessary ***/
				/*
				$(document).mousemove(function(e) {
					ui.helper.offset({top: e.pageY-15, left: e.pageX-25})
				});
				*/
				return;
			  }
		      return;
		  	},
			over: function(e, ui) {
			  if (ui.helper.hasClass("widget") && (!ui.helper.hasClass("w-field") && !ui.helper.hasClass("w-action"))) {
				ui.helper.addClass("qefield");
				ui.helper.removeClass("widget");
				ui.helper.html(ui.item.html());
				ui.helper.width(ui.item.width());
				ui.helper.height(ui.item.height());
				return;
		      }	
			  else {
				return;
			  }
			},
			sort: function(e, ui) {
				// helper follows the mouse now and probably it's more efficient than binding mousemove event to document (because it's already binded)
				if (ui.helper.hasClass("widget")) {
					ui.helper.offset({top: e.pageY-15, left: e.pageX-25});
				}
			},
		    stop: function(e, ui) {
			  if (ui.item.hasClass('ui-draggable')) {
 			    ui.item.draggable('destroy');
			  }
			  // AJAX action to remove the item from the form 
			  if (ui.item.hasClass('deleting')) {
				if (ui.item.hasClass("new-widget")) {
					ui.item.remove();
					return;
				}
				var iid;
				if (ui.item.children(".field").length != 0) {
					iid = ui.item.children(".field").attr("id").substr("archetypes-fieldname-".length);
				} else {
					iid = ui.item.children(".PFGFieldsetWidget").attr("id").substr("pfg-fieldsetname-".length);
				}
				$("img.ajax-loader").css('visibility', 'visible');
				ui.item.remove();	// remove the original item (from the DOM and thus the form)
				$.post("removeFieldFromForm", {item_id: iid}, function() { 
					$("img.ajax-loader").css('visibility', 'hidden');
				});
				return;
			  }
		   }
		});
				
		/* Initializers for editing titles, toggling required attribute on fields and limiting number of widgets in Widgets Manager */
		this.editTitles();
		this.toggleRequired();
		this.limitFields();
		
		/* set the tooltip for the widgets in Widget Manager */
		$("div.widget").tooltip({
			position: "top center",
			relative: true,
			offset: [-3, 0],
			effect: "fade",
			predelay: 700,
			opacity: 0.9
		});
		
		/* Set the initial tooltips for required and not-required spans */
		$("span.not-required").tooltip({
			position: "top center",
			relative: false,
			events: {
				def: "mouseenter, mouseout click"
			},
			onBeforeShow: function() {
				if (this.getTrigger().attr("title")) {
					this.getTip().html(this.getTrigger().attr("title"));
				}
			},
			onShow: function() {
				if (this.getTrigger().attr("title")) {
					this.getTrigger().removeAttr("title");
				}
				if (!this.getTrigger().parent().parent().is("div.qefield")) {
					this.hide();
				}
			},
			offset: [-6, 0]
		});
		
		$("span.required").tooltip({
			position: "top center",
			relative: false,
			events: {
				def: "mouseenter, mouseout click"
			},
			onBeforeShow: function() {
				if (this.getTrigger().attr("title")) {
					this.getTip().html(this.getTrigger().attr("title"));
				}
			},
			onShow: function() {
				if (this.getTrigger().attr("title")) {
					this.getTrigger().removeAttr("title");
				}
				if (!this.getTrigger().parent().parent().is("div.qefield")) {
					this.hide();
				}
			},
			offset: [-4, 0]
		});
		
		/* Make the widgets inside the widgets manager draggable */
		$("div.widget").draggable({
		  connectToSortable: "#pfg-qetable",
		  helper: 'clone',
		  containment: 'document'
		});
		
		/* Make the widgets manager droppable */
		$("div.widgets").droppable({
			accept: function(obj) {
				return !$(obj).parent().hasClass('widgets') && (!$(obj).hasClass('w-field') && !$(obj).hasClass("w-action"));
			},
			drop: function(e, ui) {
				ui.draggable.addClass("deleting");
				$("span#deactivate-widget").hide();
			},
			over: function(e, ui) {
				$("div#pfg-qetable div.placeholder").hide();
				ui.draggable.addClass("deleting");
				ui.helper.addClass("deleting");				
				$("span#deactivate-widget").show();
			},
			out: function(e, ui) {
				if (ui.draggable.hasClass("deleting")) {
					ui.draggable.removeClass("deleting");
					ui.helper.removeClass("deleting");
				}
				$("div#pfg-qetable div.placeholder").show();
				$("span#deactivate-widget").hide();
			},
			tolerance: 'pointer'
		});
		
		/* handle global AJAX error */
		$(document).ajaxError(function(event, request, settings) {
			$("img.ajax-loader").css('visibility', 'hidden');
			alert("The has been an AJAX error on requesting page: " + settings.url);
		});
	},
	
	getPos: function(node) {
	    var pos = node.parent().children('.qefield').index(node[0]);
	    return pos == -1 ? null : pos;
	},
	
	updatePositionOnServer: function(i, t) {
		if (i && t) {
			$("img.ajax-loader").css('visibility', 'visible');
		}
	    var args = {
	      item_id: i,
	      target_id: t
	    };
	    $.post('reorderField', args, function() { 
			$("img.ajax-loader").css('visibility', 'hidden');
		});
	},
	
	editTitles: function() {
		// first we create a new dynamic node (which will be used to edit content)
		var node = document.createElement("input");
		node.setAttribute('name', "change");
		node.setAttribute("type", "text");
		
		// then we attach a new event to label fields
		$("#pfg-qetable div.qefield label.formQuestion").live('dblclick', function(e) {
			var content = $(this).text();
			var tmpfor = $(this).attr('for');
			$(this).append(node);
			$(this).html($(node).val(content));
			$(node).fadeIn();
			$(this).children().unwrap();
			node.focus(); node.select();
		 
			$(node).blur(function(e) {
		  		$(this).wrap("<label class='formQuestion' for='"+ tmpfor +"'></label>");
		  		$(this).parent().html($(this).val());
				var args = {
					item_id: tmpfor,
					title: $(this).val()
				};
				if (args['title']!=content) { // only update if we actually changed the field
					$("img.ajax-loader").css('visibility', 'visible');					
					$.post("updateFieldTitle",args, function() { 
						$("img.ajax-loader").css('visibility', 'hidden');
					});
				}
		 	});
		});

	},
	
	toggleRequired: function() {
		/* old checkbox method
		var requiredParent = $("span.required").parent();
		$(requiredParent).each(function () {
			var parentId = $(this).attr('id').substr('archetypes-fieldname-'.length);
			$("#pfg-qetable").find("input[name=required-"+ parentId + "]").attr("checked", "checked");			
		});
		*/
		var target = $("div.field label").next();
		target.each(function() {
		  if (!$(this).is("span")) {
			$("<span class='not-required' style='display:inline-block' title='Make it required?'></span>").insertBefore(this);
		  }
		  else {
		    $(this).attr("title", "Remove required flag?");	
		  }
		});
				
		$("span.not-required").live("click", function(event) {
			var item = $(this).parent().attr('id').substr('archetypes-fieldname-'.length);
			$("img.ajax-loader").css('visibility', 'visible');
			// AJAX		
			$.post('toggleRequired', {item_id: item }, function() {
				$("img.ajax-loader").css('visibility', 'hidden');
			});
			$('#archetypes-fieldname-'+item).find('[name^='+item+']').attr("required", "required");
			$(this).removeClass("not-required");
			$(this).addClass("required");
			$(this).html("            ■").css({'color' : 'rgb(255,0,0)', 'display' : 'none'}).fadeIn().css("display", "inner-block");
			$(this).attr("title", "Remove required flag?");
		//	$(this).replaceWith($('<span style="color: rgb(255, 0, 0);display:none" title="Remove required flag?" class="required">■</span>').fadeIn('slow'));
		});
		
		$("span.required").live("click", function(event) {
			var item = $(this).parent().attr('id').substr('archetypes-fieldname-'.length);
			$("img.ajax-loader").css('visibility', 'visible');
			// AJAX		
			$.post('toggleRequired', {item_id: item }, function() {
				$("img.ajax-loader").css('visibility', 'hidden');
			});
			$('#archetypes-fieldname-'+item).find('[name^='+item+']').removeAttr("required");
			$(this).removeClass("required");
			$(this).addClass("not-required");
			$(this).html("").fadeIn().css("display", "inline-block");
			$(this).attr("title", "Make it required?");
		//	$(this).replaceWith($("<span class='not-required' style='border:1px solid red; width:7px; height:7px; display:none' title='Make it required?'></span>").fadeIn('slow').css("display", "inline-block"));
		});
		
		
		
		/* old checkbox method
		$("#pfg-qetable").find("input[name^=required-]").bind('change', function(event) {
		//	event.preventDefault();
			var id = $(this).attr('name').substr('required-'.length);
			var requiredSpan = $('#archetypes-fieldname-'+id).find("span.required");
			$("img.ajax-loader").css('visibility', 'visible');				
			$.post('toggleRequired', {item_id: id }, function() {
				// we put the required actions after we are sure the toggle is done on the server!
				if (requiredSpan.length) { // remove the little tile and set input's required attr
					requiredSpan.fadeOut(1000).remove();
					$('#archetypes-fieldname-'+id).find('[name^='+id+']').removeAttr("required");
				}
				else {
					var spel = document.createElement("span");	// create a new span element to mark required fields
					$(spel).attr("class", "required");
				 	$(spel).css('color','rgb(255, 0, 0)');
					$(spel).html("            ■");
					$('#archetypes-fieldname-'+id+' label.formQuestion').after($(spel).fadeIn(1000));
					$('#archetypes-fieldname-'+id).find('[name^='+id+']').attr("required", "required")
				}
				$("img.ajax-loader").css('visibility', 'hidden')
			});
			return true;
		});
		*/
	},
	
	limitFields: function() {
		$("div.w-field").slice(7).hide();
		if (!$(".more").length)	{		// if there's no "More fields..." link, create it.
			$("div.w-field:not(:hidden):last").next().after("<div class='more'>More fields...</div>");
		}

		$(".more").toggle(
			function() {
				$(this).hide();
				$("div.widgets div.w-field").slice(7).fadeIn();
				$(this).insertAfter($("div.w-field:not(:hidden):last").next());
				$(this).html("Less fields...").show();
			},
			function() {
				$(this).hide();
				$("div.widgets div.w-field").slice(7).fadeOut();
				$(this).insertAfter($("div.w-field:not(:hidden):last").next());
				$(this).html("More fields...").show();
			}
		);
	},
	
	deinit: function() {
		$("label.formQuestion").die(); // removes event handlers setup by .live
		$(".more").remove();		// remove the item with bounded events to avoid conflict when "quick-edit mode" is called again
		$("span.not-required").die();
		$("span.not-required").remove(); // we don't want blank square showed in the form
		$("span.required").die(); // remove live() event listener
		// hide all the error messages so far!
		if ($("div.error").length > 0) {
			$("div.error").hide();
		}
	}	
};	
})(jQuery);