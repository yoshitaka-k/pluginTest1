/**
* jQuery.jsonSearchBox
* @version  0.2.0
* @author   Yoshitaka <yoshitaka.ktgwya@gmail.com>
* @license  MIT License (https://github.com/yoshitaka-k/blob/master/LICENSE.md)
* @link     https://github.com/yoshitaka-k
* jQuery.jsonSearchBox
* @version  0.2.0
* @author   Yoshitaka <yoshitaka.ktgwya@gmail.com>
* @license  MIT License (https://github.com/yoshitaka-k/blob/master/LICENSE.md)
* @link     https://github.com/yoshitaka-k
*
* @options requestUrl {String}
*          ※ JSON情報を取得するURL
*          ※ こちらを設定した場合は、下記オプション『requestDoneEvent』にて取得した情報を、
*             Dictionaryへ格納した後、returnしてください。
* @options json {String} JSON型の文字列
*          ※ 『json』オプションと、上記『requestUrl』オプションの両方が設定されている場合は、
*             こちらの方が優先されます。
* @options searching {Bool} 入力フォームの値を元に検索するか
*          ※ false の場合は常に設定された値を表示するようになります。
* @options jsonLoadEvent {Function}
*          ※ JSON文字列をJSON型へエンコードした後に実行される処理の設定ができます。
* @options requestDoneEvent {Function}
*          ※ requestUrlを元に情報を取得した後に実行される処理の設定ができます。
* @options requestFailEvent {Function}
*          ※ requestUrlを元に情報の取得に失敗した後に実行される処理の設定ができます。
* @options resultClickEvent {Function}
*          ※ 検索結果のリストをクリックした後に実行される処理の設定ができます。
*/
;(function($, undefined) {
  "use strict";
  let _KEY = {
    UP: 38, DOWN: 40, LEFT: 37, RIGHT: 39,
    SHIFT: 16, CTRL: 17, ALT: 18,
    WIN: 91, APPLE: 93,
    HOME: 36, END: 35,
  };

  let _SEARCHBOX_CLASSNAME = 'json_search_box';
  let _SYMBOL = 'pt';
  var _UUID = new Date().getTime();
  var _JSON = {};

  /**
  * 各要素にプラグインをセット
  * @param {Dictionary} options プラグインに対しての設定
  */
  $.fn.pluginTest = function(options) {
    return this.each(function(){
      (new PluginTest).init($(this), options);
    });
  };

  /**
  * PluginTest
  */
  function PluginTest() {};
  PluginTest.prototype = $.extend({
    /**
    * 初期化
    * @param {Element} elem プラグインを指定した要素
    * @param {Dictionary} options プラグインに対しての設定
    * @return this
    */
    init: function(elem, options) {
      // 要素を控える
      this.elem = elem;
      // 認識用ID生成
      _UUID += 1;
      if (this.elem.attr('id') !== '') this.elem.attr('data-id', _SYMBOL+_UUID);
      this.setOptions(options)
          .load()
          .setEvent();
      return this;
    },
    /**
    * 設定を反映
    * @param {Dictionary} options 設定内容
    * @return this
    */
    setOptions: function(options) {
      if (this.options && !options) return this;
      if (this.options) {
        $.extend(this.options, options);
        return this;
      }
      this.options = $.extend({
        requestUrl: '',
        json: '',
        searching: true,
        jsonLoadEvent: function() {},
        requestDoneEvent: function() {},
        requestFailEvent: function() {},
      }, options);
      return this;
    },
    /**
    * json / requestUrl を読み込む
    * @return this
    */
    load: function() {
      if (this.options.json != '') this.jsonLoad();
      else if (this.options.requestUrl != '') this.ajaxLoad();
      return this;
    },
    /**
    * 何かを表示する
    * @return this
    */
    build: function() {
      let uuid = '#' + _SYMBOL+_UUID;
      let boxClass = '.' + _SEARCHBOX_CLASSNAME;
      if ($('div' + uuid + boxClass).length !== 0) return this;
      var $div = $('<div/>').attr('id', _SYMBOL + _UUID)
                            .addClass(_SEARCHBOX_CLASSNAME)
                            .css('display', 'none');
      this.elem.parent().append($div);
      return this;
    },
    /**
    * 入力フォームにイベントを設定する
    * @return this
    */
    setEvent: function() {
      let self = this;
      this.elem.on({
        'focus': function(event) { self.build().show(event) },
        'change': function(event) { self.build().show(event) },
        'keyup': function(event) { self.build().show(event) },
      });
      $(document).on('click', function(e) {
        if ($(e.target).attr('data-id') == self.elem.attr('data-id')) {
          return;
        }
        self.hide();
      });
      return this;
    },
    /**
    * 検索結果のリストを表示する
    * @return this
    */
    show: function(event) {
      var searching = true;
      $.each(_KEY, function(k, v) {
        if (v === event.which) searching = false;
      });
      if (!searching) return this;

      let $searchBox = $('div#' + (this.elem.attr('data-id')) + '.' + _SEARCHBOX_CLASSNAME);

      let searchResults = this.search(event);
      if (Object.keys(searchResults).length == 0) {
        $searchBox.remove();
        return this;
      }

      $searchBox.hide().html('');
      let self = this;
      let $ul = $('<ul/>');
      $.each(searchResults, function(key, value) {
        let $a = $('<a/>').attr('id', key)
                          .attr('href', 'javascript:;')
                          .attr('data-href', self.elem.attr('id'))
                          .html(value)
                          .on('click', function(e) {
                            e.preventDefault();
                            self.elem.val($(this).html());
                            self.hide();
                          });
        $ul.append($('<li/>').html($a));
      });
      $searchBox.html($ul).slideDown(200);
      return this;
    },
    /**
    * 検索結果のリストを非表示にする
    * @return this
    */
    hide: function() {
      $('div.' + _SEARCHBOX_CLASSNAME).slideUp(200, function() {
        $(this).remove();
      });
      return this;
    },
    /**
    * JSONを検索
    * @param InputEventObject
    * @return Object
    */
    search: function() {
      if (!this.elem.val() || !this.options.searching) return _JSON;
      let self = this;
      var obj = {};
      $.each(_JSON, function(i, e) {
        if (e.indexOf(self.elem.val()) != -1) obj[i] = e;
      });
      return obj;
    },
    /**
    * JSONを変数へ格納
    */
    jsonLoad: function() {
      _JSON = this.options.json;
      this.options.jsonLoadEvent();
    },
    /**
    * JSONを検索
    */
    ajaxLoad: function() {
      $.ajax({
        type: 'get',
        url: this.options.requestUrl,
        dataType: 'jsonp',
        context: this,
      })
      .done(function(data, status) {
        _JSON = this.options.requestDoneEvent(data);
      })
      .fail(function(xhr, error) {
        this.options.requestFailEvent(xhr, error);
      });
    },
  }, PluginTest.prototype);
})(jQuery);
