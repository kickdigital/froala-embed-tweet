/*!
 * License http://opensource.org/licenses/MIT
 * Copyright 2015 Kick Digital Ltd
 */

(function ($) {
	$.Editable.DEFAULTS = $.extend($.Editable.DEFAULTS, {
		tweetAllowedAttrs: ['class', 'lang', 'dir', 'href'],
		tweetAllowedTags: ['blockquote', 'a'],
		defaultTweetAlignment: 'center',
		textNearTweet: true
	});

	$.Editable.TWEET_PROVIDERS = [];

	$.Editable.tweet_commands = {
		floatTweetLeft: {
			title: 'Float Left',
			icon: {
				type: 'font',
				value: 'fa fa-align-left'
			}
		},

		floatTweetNone: {
			title: 'Float None',
			icon: {
				type: 'font',
				value: 'fa fa-align-justify'
			}
		},

		floatTweetRight: {
			title: 'Float Right',
			icon: {
				type: 'font',
				value: 'fa fa-align-right'
			}
		},

		removeTweet: {
			title: 'Remove Tweet',
			icon: {
				type: 'font',
				value: 'fa fa-trash-o'
			}
		}
	};

	$.Editable.DEFAULTS = $.extend($.Editable.DEFAULTS, {
		tweetButtons: ['floatTweetLeft', 'floatTweetNone', 'floatTweetRight', 'removeTweet']
	});

	$.Editable.commands = $.extend($.Editable.commands, {
		insertTweet: {
			title: 'Insert Tweet',
			icon: 'fa fa-twitter',
			callback: function () {
				this.insertTweet();
			},
			undo: false
		}
	});

	/**
	 * Insert tweet.
	 */
	$.Editable.prototype.insertTweet = function () {
		if (!this.options.inlineMode) {
			this.closeImageMode();
			this.imageMode = false;
			this.positionPopup('insertTweet');
		}

		if (this.selectionInEditor()) {
			this.saveSelection();
		}

		this.showInsertTweet();

		this.$tweet_wrapper.find('textarea').val('');
	};


	$.Editable.prototype.insertTweetHTML = function () {
		return '<div class="froala-popup froala-tweet-popup" style="display: none;"><h4><span data-text="true">Insert Tweet</span><i title="Cancel" class="fa fa-times" id="f-tweet-close-' + this._id + '"></i></h4><div class="f-popup-line"><textarea placeholder="Embedded code" id="f-tweet-textarea-' + this._id + '"></textarea></div><div class="f-popup-line"><span data-text="true"><a target="_blank" href="https://support.twitter.com/articles/20169559"><i class="fa fa-question-circle"></i> How to embed a Tweet</a></span><input type="hidden" placeholder="http://twitter.com/" id="f-tweet-input-' + this._id + '"/><button data-text="true" class="f-ok f-submit fr-p-bttn" id="f-tweet-ok-' + this._id + '">OK</button></div></div>';
	};

	$.Editable.prototype.buildInsertTweet = function () {
		this.$tweet_wrapper = $(this.insertTweetHTML());
		this.$popup_editor.append(this.$tweet_wrapper);

		this.addListener('hidePopups', this.hideTweetWrapper);

		// Stop event propagation in tweet wrapper.
		this.$tweet_wrapper.on('mouseup touchend', $.proxy(function (e) {
			if (!this.isResizing()) {
				e.stopPropagation();
			}
		}, this));

		this.$tweet_wrapper.on('mouseup keydown', 'input#f-tweet-input-' + this._id + ', textarea#f-tweet-textarea-' + this._id, $.proxy(function (e) {
			e.stopPropagation();
		}, this));

		var that = this;
		this.$tweet_wrapper.on('change', 'input#f-tweet-input-' + this._id + ', textarea#f-tweet-textarea-' + this._id, function () {
			if (this.tagName == 'INPUT') {
				that.$tweet_wrapper.find('textarea#f-tweet-textarea-' + that._id).val('');
			} else if (this.tagName == 'TEXTAREA') {
				that.$tweet_wrapper.find('input#f-tweet-input-' + that._id).val('');
			}
		});

		this.$tweet_wrapper.on('click', 'button#f-tweet-ok-' + this._id, $.proxy(function () {
			var $input = this.$tweet_wrapper.find('input#f-tweet-input-' + this._id);
			var $textarea = this.$tweet_wrapper.find('textarea#f-tweet-textarea-' + this._id);
			if ($input.val() !== '') {
				this.writeTweet($input.val(), false);
			} else if ($textarea.val() !== '') {
				this.writeTweet($textarea.val(), true);
			}
		}, this));

		this.$tweet_wrapper.on(this.mouseup, 'i#f-tweet-close-' + this._id, $.proxy(function () {
			this.$bttn_wrapper.show();
			this.hideTweetWrapper();

			if (this.options.inlineMode && !this.imageMode && this.options.buttons.length === 0) {
				this.hide();
			}

			this.restoreSelection();
			this.focus();

			if (!this.options.inlineMode) {
				this.hide();
			}
		}, this));

		this.$tweet_wrapper.on('click', function (e) {
			e.stopPropagation();
		});

		this.$tweet_wrapper.on('click', '*', function (e) {
			e.stopPropagation();
		});

		// Remove tweet on delete key hit.
		this.$window.on('keydown.' + this._id, $.proxy(function (e) {
			if (this.$element.find('.f-tweet-editor.active').length > 0) {
				var keyCode = e.which;
				// Delete.
				if (keyCode == 46 || keyCode == 8) {
					e.stopPropagation();
					e.preventDefault();
					setTimeout($.proxy(function () {
						this.removeTweet();
					}, this), 0);
					return false;
				}
			}
		}, this));
	};

	$.Editable.prototype.destroyTweet = function () {
		this.$tweet_wrapper.html('').removeData().remove();
	};

	$.Editable.prototype.initTweet = function () {
		this.buildInsertTweet();

		this.addTweetControls();

		this.addListener('destroy', this.destroyTweet);
	};

	$.Editable.initializers.push($.Editable.prototype.initTweet);

	$.Editable.prototype.hideTweetEditorPopup = function () {
		if (this.$tweet_editor) {
			this.$tweet_editor.hide();
			$('div.f-tweet-editor').removeClass('active');

			this.$element.removeClass('f-non-selectable');
			if (!this.editableDisabled && !this.isHTML) {
				this.$element.attr('contenteditable', true);
			}
		}
	};

	$.Editable.prototype.showTweetEditorPopup = function () {
		this.hidePopups();

		if (this.$tweet_editor) {
			this.$tweet_editor.show();
		}

		this.$element.removeAttr('contenteditable');
	};

	$.Editable.prototype.addTweetControlsHTML = function () {
		this.$tweet_editor = $('<div class="froala-popup froala-tweet-editor-popup" style="display: none">');

		var $buttons = $('<div class="f-popup-line">').appendTo(this.$tweet_editor);

		for (var i = 0; i < this.options.tweetButtons.length; i++) {
			var cmd = this.options.tweetButtons[i];
			if ($.Editable.tweet_commands[cmd] === undefined) {
				continue;
			}
			var button = $.Editable.tweet_commands[cmd];

			var btn = '<button class="fr-bttn" data-callback="' + cmd + '" data-cmd="' + cmd + '" title="' + button.title + '">';

			if (this.options.icons[cmd] !== undefined) {
				btn += this.prepareIcon(this.options.icons[cmd], button.title);
			} else {
				btn += this.prepareIcon(button.icon, button.title);
			}

			btn += '</button>';

			$buttons.append(btn);
		}

		this.addListener('hidePopups', this.hideTweetEditorPopup);

		this.$popup_editor.append(this.$tweet_editor);

		this.bindCommandEvents(this.$tweet_editor);
	};

	$.Editable.prototype.floatTweetLeft = function () {
		var $activeTweet = $('div.f-tweet-editor.active');

		$activeTweet.attr('class', 'f-tweet-editor active fr-fvl');

		this.triggerEvent('tweetFloatedLeft');

		$activeTweet.click();
	};

	$.Editable.prototype.floatTweetRight = function () {
		var $activeTweet = $('div.f-tweet-editor.active');

		$activeTweet.attr('class', 'f-tweet-editor active fr-fvr');


		this.triggerEvent('tweetFloatedRight');

		$activeTweet.click();
	};

	$.Editable.prototype.floatTweetNone = function () {
		var $activeTweet = $('div.f-tweet-editor.active');

		$activeTweet.attr('class', 'f-tweet-editor active fr-fvn');

		this.triggerEvent('tweetFloatedNone');

		$activeTweet.click();
	};

	$.Editable.prototype.removeTweet = function () {
		$('div.f-tweet-editor.active').remove();

		this.hide();

		this.triggerEvent('tweetRemoved');

		this.focus();
	};

	$.Editable.prototype.refreshTweet = function () {
		this.$element.find('iframe, object').each (function (index, iframe) {
			var $iframe = $(iframe);

			for (var i = 0; i < $.Editable.TWEET_PROVIDERS.length; i++) {
				var vp = $.Editable.TWEET_PROVIDERS[i];

				if (vp.test_regex.test($iframe.attr('src'))) {
					if ($iframe.parents('.f-tweet-editor').length === 0) {
						$iframe.wrap('<div class="f-tweet-editor fr-fvn" data-fr-verified="true" contenteditable="false">');
					}

					break;
				}
			}
		});

		if (this.browser.msie) {
			this.$element.find('.f-tweet-editor').each (function () {
				this.oncontrolselect = function () {
					return false;
				};
			});
		}

		if (!this.options.textNearTweet) {
			this.$element.find('.f-tweet-editor')
				.attr('contenteditable', false)
				.addClass('fr-tnv');
		}
	};

	$.Editable.prototype.addTweetControls = function () {
		this.addTweetControlsHTML();

		this.addListener('sync', this.refreshTweet);

		this.$element.on('mousedown', 'div.f-tweet-editor', $.proxy(function (e) {
			e.stopPropagation();
		}, this));

		this.$element.on('click touchend', 'div.f-tweet-editor', $.proxy(function (e) {
			if (this.isDisabled) return false;

			e.preventDefault();
			e.stopPropagation();

			var target = e.currentTarget;

			this.clearSelection();

			this.showTweetEditorPopup();
			this.showByCoordinates($(target).offset().left + $(target).width() / 2, $(target).offset().top + $(target).height() + 3);

			$(target).addClass('active');

			this.refreshTweetButtons(target);
		}, this));
	};

	$.Editable.prototype.refreshTweetButtons = function (tweet_editor) {
		var tweet_float = $(tweet_editor).attr('class');
		this.$tweet_editor.find('[data-cmd]').removeClass('active');

		if (tweet_float.indexOf('fr-fvl') >= 0) {
			this.$tweet_editor.find('[data-cmd="floatTweetLeft"]').addClass('active');
		}
		else if (tweet_float.indexOf('fr-fvr') >= 0) {
			this.$tweet_editor.find('[data-cmd="floatTweetRight"]').addClass('active');
		}
		else {
			this.$tweet_editor.find('[data-cmd="floatTweetNone"]').addClass('active');
		}
	};

	$.Editable.prototype.writeTweet = function (tweet_obj, embeded) {
		var tweet = null;

		if (!embeded) {
			for (var i = 0; i < $.Editable.TWEET_PROVIDERS.length; i++) {
				var vp = $.Editable.TWEET_PROVIDERS[i];
				if (vp.test_regex.test(tweet_obj)) {
					tweet_obj = tweet_obj.replace(vp.url_regex, vp.url_text);
					tweet = vp.html.replace(/\{url}/, tweet_obj);
					break;
				}
			}
		} else {
			tweet = this.clean(tweet_obj, true, false, this.options.tweetAllowedTags, this.options.tweetAllowedAttrs);
		}

		if (tweet) {
			this.restoreSelection();
			this.$element.focus();

			var aligment = 'fr-fvn';
			if (this.options.defaultTweetAlignment == 'left') aligment = 'fr-fvl';
			if (this.options.defaultTweetAlignment == 'right') aligment = 'fr-fvr';

			if (!this.textNearTweet) aligment += ' fr-tnv';

			try {
				this.insertHTML('<div contenteditable="false" class="f-tweet-editor ' + aligment + '" data-fr-verified="true">' + tweet + '</div>');
			}
			catch (ex) {}

			this.$bttn_wrapper.show();
			this.hideTweetWrapper();
			this.hide();

			// call with (tweet)
			this.triggerEvent('tweetInserted', [tweet]);
		} else {
			// call with ([])
			this.triggerEvent('tweetError');
		}
	};

	$.Editable.prototype.showTweetWrapper = function () {
		if (this.$tweet_wrapper) {
			this.$tweet_wrapper.show();
			this.$tweet_wrapper.find('.f-popup-line input').val('')
		}
	};

	$.Editable.prototype.hideTweetWrapper = function () {
		if (this.$tweet_wrapper) {
			this.$tweet_wrapper.hide();
			this.$tweet_wrapper.find('input').blur()
		}
	};

	$.Editable.prototype.showInsertTweet = function () {
		this.hidePopups();

		this.showTweetWrapper();
	};

})(jQuery);
