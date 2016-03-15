/*
 * jQuery Plug-In: Table sort
 *
 *
 * The MIT License
 *
 * Copyright 2016 Michael Weber <me@michiweber.de>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

(function($){

	$.fn.tableSort = function(){

		var method = (arguments.length === 2) ? arguments[0] : ((arguments.length === 1 && typeof arguments[0] === 'string' ? arguments[0] : undefined));
		var options = $.extend({
			sort: 0,
			direction: 'ASC',
			sorting: 'ascii',
			groups: false,
			rotation: true,
			rotationTrigger: 'DESC',
			methods: {
				ASC: function(a,b){
					if(options.groups && $(a).data('table-sort-group') !== $(b).data('table-sort-group')) {
						return 0;
					}
					a = $(a).find('[data-table-sort-col="' + options.sort + '"]').text();
					b = $(b).find('[data-table-sort-col="' + options.sort + '"]').text();
					if(a < b) return -1;
					if(a > b) return 1;
					return 0;
				},
				DESC: function(a,b){
					if(options.groups && $(a).data('table-sort-group') !== $(b).data('table-sort-group')) {
						return 0;
					}
					a = $(a).find('[data-table-sort-col="' + options.sort + '"]').text();
					b = $(b).find('[data-table-sort-col="' + options.sort + '"]').text();
					if(a > b) return -1;
					if(a < b) return 1;
					return 0;
				},
				ASCNATURAL: function(a,b) {
					if(options.groups && $(a).data('table-sort-group') !== $(b).data('table-sort-group')) {
						return 0;
					}
					a = $(a).find('[data-table-sort-col="' + options.sort + '"]').text();
					b = $(b).find('[data-table-sort-col="' + options.sort + '"]').text();
					return naturalSort(a,b);
				},
				DESCNATURAL: function(a,b) {
					if(options.groups && $(a).data('table-sort-group') !== $(b).data('table-sort-group')) {
						return 0;
					}
					a = $(a).find('[data-table-sort-col="' + options.sort + '"]').text();
					b = $(b).find('[data-table-sort-col="' + options.sort + '"]').text();
					return naturalSort(b,a);
				},
				CLEAR: function(a,b) {
					a = $(a).data('table-sort-original');
					b = $(b).data('table-sort-original');
					if(a < b) return -1;
					if(a > b) return 1;
					return 0;
				}
			}
		},(arguments.length === 2) ? arguments[1] : ((arguments.length === 1 && typeof arguments[0] === 'object' ? arguments[0] : {} )));

		if(options.sorting === 'natural' && typeof naturalSort === 'undefined') {
			throw Error('Natural Sort algorithm for Javascript is needed (You can get it here: https://github.com/michiweber/javascript-natural-sort)');
		}

		this.clear = function(){
			var tbody = $(this).find('tbody');
			tbody.find('tr').remove().sort(options.methods.CLEAR).each(function(){
				tbody.append($(this));
			});
			$(this).find('thead').find('td,th').removeClass('table-sort-ASC').removeClass('table-sort-DESC').attr('data-table-sort-direction',null);
		}

		this.sort = function(){
			var tbody = $(this).find('tbody');
			var tr = tbody.find('tr').each(function(){
				if($(this).data('table-sort-original') === undefined) {
					$(this).attr('data-table-sort-original',$(this).index());
				}
				if($(this).data('table-sort-fixed') === '') {
					var last = $(this).prevAll('[data-table-sort-row="' + $(this).prev().data('table-sort-row') + '"]').last();
					$(this).attr('data-table-sort-fixed',(last.length > 0 ? last.index() + 1 : $(this).index()));
				}
			}).remove();
			tr.not('[data-table-sort-fixed]').find('td[data-table-sort-col="' + options.sort + '"]').parent().sort((options.sorting === 'natural' ? options.methods[options.direction + 'NATURAL'] : options.methods[options.direction])).each(function(i){
				tbody.append($(this).addClass('sorted'));
			});
			var fixed = [];
			tr.each(function(){
				if(!$(this).hasClass('sorted')) {
					var sorted = tbody.find('tr').filter('[data-table-sort-row="' + $(this).data('table-sort-row') + '"]');
					if($(this).data('table-sort-fixed') !== undefined) {
						fixed.push(this);
					} else if(sorted.length === 0) {
						if(options.groups) {
							$(this).insertAfter(tbody.children('[data-table-sort-group="' + $(this).data('table-sort-group') + '"]').last());
						} else {
							tbody.append($(this));
						}
					} else {
						if(sorted.children('td[rowspan]').length > 0) {
							$(this).insertAfter(sorted.last());
						} else {
							$(this).insertBefore(sorted.first());
						}
					}
				}
			});
			$.each(fixed, function(){
				if($(this).data('table-sort-fixed') === 0) {
					$(this).insertBefore(tbody.children('tr').first());
				} else {
					var el = tbody.find('tr').eq($(this).data('table-sort-fixed')-1);
					var last = el.nextAll('[data-table-sort-row="' + el.data('table-sort-row') + '"]').last();
					$(this).insertAfter(last.length > 0 ? last : el);
				}
			});
			$(this).find('tr.sorted').removeClass('sorted').end().find('thead').find('td').removeClass('table-sort-ASC').removeClass('table-sort-DESC').attr('data-table-sort-direction',null).end().find('td[data-table-sort-col="' + options.sort + '"],th[data-table-sort-col="' + options.sort + '"]').addClass('table-sort-' + options.direction).attr('data-table-sort-direction',options.direction);
		};

		this.init = function(){
			$(this).children('tbody').find('tr').each(function(index){
				var index = ++index;
				var rowspan = $(this).children('td').attr('rowspan');
				if(rowspan !== undefined) {
					for(var i=1;i<rowspan;i++) {
						$(this).nextAll(':nth-child(' + (index + i) + ')').attr('data-table-sort-row',index);
					}
				}
				if($(this).data('table-sort-row') === undefined) {
					$(this).attr('data-table-sort-row', index);
				}
				$(this).children('td').each(function(tdindex){
					var prev = $(this).parent().prevAll('[data-table-sort-row="' + $(this).parent().data('table-sort-row') + '"]');
					++tdindex;
					if(prev.length > 0) {
						$(this).attr('data-table-sort-col',tdindex + prev.last().children('td').last().data('table-sort-col'));
					} else {
						$(this).attr('data-table-sort-col',tdindex);
					}
				});
			});
			$(this).find('thead').find('th,td').each(function(thindex){
				$(this).attr('data-table-sort-col',++thindex);
			}).click(function(){
				if(options.rotation && $(this).attr('data-table-sort-direction') === options.rotationTrigger) {
					options.direction = 'ASC';
					$(this).parents('table').tableSort('clear',options);
				} else {
					options.sort = $(this).data('table-sort-col');
					options.direction = $(this).attr('data-table-sort-direction') === undefined ? options.direction : ($(this).attr('data-table-sort-direction') === 'ASC' ? 'DESC' : 'ASC');
					$(this).parents('table').tableSort('sort',options);
				}
			});
			if(options.sort > 0) {
				$(this).tableSort('sort',options);
			}
		};

		if(method !== undefined){
			return this[method].call($(this));
		} else {
			return this.init.call(this);
		}
	};

	$(document).ready(function(){
		$('table.table-sort').each(function(){
			var options = {};
			if($(this).data('table-sort-option-sort') !== undefined) {
				options.sort = $(this).data('table-sort-option-sort');
			}
			if($(this).data('table-sort-option-direction') !== undefined) {
				options.direction = $(this).data('table-sort-option-direction');
			}
			if($(this).data('table-sort-option-sorting') !== undefined) {
				options.sorting = $(this).data('table-sort-option-sorting');
			}
			if($(this).data('table-sort-option-groups') !== undefined) {
				options.groups = $(this).data('table-sort-option-groups');
			}
			if($(this).data('table-sort-option-rotation') !== undefined) {
				options.rotation = $(this).data('table-sort-option-rotation');
			}
			if($(this).data('table-sort-option-rotation-trigger') !== undefined) {
				options.rotationTrigger = $(this).data('table-sort-option-rotation-trigger');
			}
			$(this).tableSort(options);
		});
	});

}(jQuery));
