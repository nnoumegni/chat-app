!(function (global) {
    "use strict";
    
    // Use existing TynApp object or create a new one
    var TynApp = global.TynApp || {};

    // Add utility functions
    TynApp.Load = function(fn) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn);
        } else {
            fn();
        }
    };

    TynApp.Resize = function(fn) {
        window.addEventListener('resize', fn);
    };

    // Add required constants
    TynApp.Body = document.body;
    TynApp.Breakpoints = {
        xl: 1200,
        lg: 992,
        md: 768,
        sm: 576
    };
    TynApp.Page = {
        Width: window.innerWidth,
        Height: window.innerHeight
    };

    TynApp.ActiveLink = function(selector, active){
      let elm = document.querySelectorAll(selector);
      let currentURL = document.location.href,
          removeHash = currentURL.substring(0, (currentURL.indexOf("#") == -1) ? currentURL.length : currentURL.indexOf("#")),
          removeQuery = removeHash.substring(0, (removeHash.indexOf("?") == -1) ? removeHash.length : removeHash.indexOf("?")),
          fileName = removeQuery;

      elm && elm.forEach(function(item){
        var selfLink = item.getAttribute('href');
        if (fileName.match(selfLink)) {
          item.parentElement.classList.add(...active);
        } else {
          item.parentElement.classList.remove(...active);
        }
      })
    }

    TynApp.Appbar = function(){
      let elm = document.querySelector('.tyn-appbar');
      if(elm){
        document.querySelector('.tyn-root').style.setProperty('--appbar-height', `${elm.offsetHeight}px`)
      }
    } 
    

    TynApp.Chat = {
      reply: {
        search : function(){
          let elm = document.querySelectorAll('.js-toggle-chat-search'); 
          if(elm){
            elm.forEach(item => {
              item.addEventListener('click', (e)=>{
                e.preventDefault();
                document.getElementById('tynChatSearch').classList.toggle('active');
              })
            })
          }
        },
        scroll: function(){
          let elm = document.querySelectorAll('.js-scroll-to-end');
          if(elm){
            elm.forEach(item => {
              let simpleBody = new SimpleBar(item);
              let height = item.querySelector('.simplebar-content > *').scrollHeight
              simpleBody.getScrollElement().scrollTop = height;
            })
          }
        },
        input: function(){
          let chatInput = document.querySelector('#tynChatInput');
          if(chatInput){
            chatInput.focus()
          }
        },
        quick: function(){
          let elm = document.querySelectorAll('.js-toggle-quick'); 
          if(elm){
            elm.forEach(item => {
              item.addEventListener('click', (e)=>{
                e.preventDefault();
                document.getElementById('tynQuickChat').classList.toggle('active')
              })
            })
          }
        },
        send: function(){},
      },
      item : function(){
        let elm = document.querySelectorAll('.js-toggle-main'); 
        if(elm){
          elm.forEach(item => {
            item.addEventListener('click', (e)=>{
              let isOption = e.target.closest('.tyn-aside-item-option');
              elm.forEach(item =>{
                !isOption && item.classList.remove('active')
              })
              !isOption && item.classList.add('active');
              !isOption && document.getElementById('tynMain').classList.toggle('main-shown');
            })
          })
        }
      },
      mute : function(){
        let muteToggle = document.querySelector('.js-chat-mute-toggle'); 
        let mute = document.querySelector('.js-chat-mute'); 
        const muteOptionsModal = muteToggle && new bootstrap.Modal('#muteOptions', {})
        if(muteToggle){
          muteToggle.addEventListener('click', (e)=>{
            e.preventDefault();
            if(!muteToggle.classList.contains('chat-muted')){
              muteOptionsModal.show();
            }else{
              muteToggle.classList.remove('chat-muted');
            }
          })
        }
        if(mute){
          mute.addEventListener('click', (e)=>{
            e.preventDefault();
            muteOptionsModal.hide();
            muteToggle.classList.add('chat-muted');
          })
        }
      },
      aside: function(){
        let elm = document.querySelector('.js-toggle-chat-options'); 
        if(elm){
            let target = document.getElementById('tynChatAside');
            let chat = document.getElementById('tynMain');
            target.insertAdjacentHTML('beforebegin', `<div class="tyn-overlay js-toggle-chat-options" ></div>`);
            let overlay = document.querySelector('.tyn-overlay.js-toggle-chat-options');
            
              function asideshow(){
                elm.classList.add('active');
                target.classList.add('show-aside');
                chat.classList.add('aside-shown');
                if(TynApp.Page.Width < TynApp.Breakpoints.xl){
                  overlay.classList.add('active');
                }
              }
              function asidehide(){
                elm.classList.remove('active');
                target.classList.remove('show-aside');
                chat.classList.remove('aside-shown');
                if(TynApp.Page.Width < TynApp.Breakpoints.xl){
                  overlay.classList.remove('active');
                }
              }
      
              if(TynApp.Page.Width > TynApp.Breakpoints.xl){
                asideshow();
              }
            
              elm.addEventListener('click', (e)=>{
                e.preventDefault();
                if(!chat.classList.contains('aside-shown')){
                  asideshow();
                }else{
                  asidehide()
                }
              })
            
              overlay.addEventListener('click', (e)=>{
                e.preventDefault();
                asidehide();
              })
      
              const chatObserver = new ResizeObserver((entries) => {
                for (const entry of entries) {
                  if(entry.contentRect.width > TynApp.Breakpoints.xl){
                    overlay.classList.remove('active');
                    chat.classList.remove('aside-collapsed');
                  }else{
                    setTimeout(() => {
                      chat.classList.add('aside-collapsed');
                    }, 1000);
                  }
      
                  if(entry.contentRect.width < TynApp.Breakpoints.xl){
                    if(!chat.classList.contains('aside-collapsed')){
                      asidehide();
                    }
                    
                  }
                }
              });
            
              chatObserver.observe(TynApp.Body);
        }
      },
      botsend: function(){
        let chatSend = document.querySelector('#tynBotSend');
        let chatInput = document.querySelector('#tynBotInput');
        let chatReply = document.querySelector('#tynBotReply');
        let chatBody = document.querySelector('#tynBotBody');

        chatSend && chatSend.addEventListener("click", function(event){
          event.preventDefault();
          let getInput = chatInput.innerText;
          let markupTemplate = `
          <div class="tyn-qa-item">
              <div class="tyn-qa-avatar">
                  <div class="tyn-media tyn-size-md">
                      <img src="images/avatar/1.jpg" alt="">
                  </div>
              </div>
              <div class="tyn-qa-message tyn-text-block"> ${getInput} </div>
          </div>`;  
          
          chatReply.insertAdjacentHTML("beforeend", markupTemplate)
          
          chatInput.innerHTML = "";
          let simpleBody = SimpleBar.instances.get(document.querySelector('#tynBotBody'));
          let height = chatBody.querySelector('.simplebar-content > *').scrollHeight;
          simpleBody.getScrollElement().scrollTop = height;
        })

        chatInput && chatInput.addEventListener("keypress", function(event) {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault()
            chatSend.click();
          }
        });
      }
    }

    // Define TynApp.Plugins first
    TynApp.Plugins = {
      lightbox : function(){
        const lightbox = GLightbox({
          touchNavigation: true,
          loop: true,
          autoplayVideos: true
        });
      },
      slider : {
        stories : function(){
          let storiesThumb = document.querySelector('.tyn-stories-thumb');
          let storiesSlider = document.querySelector('.tyn-stories-slider');
          let autoplayDelay = 5000;
          storiesSlider && storiesSlider.querySelector('.swiper-pagination').style.setProperty("--slide-delay", `${autoplayDelay}ms`);
          const thumbCount = storiesThumb && storiesThumb.querySelectorAll('.swiper-slide').length;
          const thumb = new Swiper('.tyn-stories-thumb', {
            slidesPerView: 2,
            freeMode: true,
            cssMode:true,
            spaceBetween:0,
            grid: {
              rows: thumbCount/2,
            },
          });
          const main = new Swiper('.tyn-stories-slider', {
            speed: 400,
            spaceBetween: 0,
            slidesPerView: 1,
            effect: "fade",
            grabCursor: true,
            autoplay: {
              delay: autoplayDelay,
              disableOnInteraction: false,
              waitForTransition:false
            },
            navigation: {
              nextEl: ".swiper-button-next",
              prevEl: ".swiper-button-prev",
            },
            thumbs: {
              swiper: thumb,
            },
            pagination: {
              el: ".swiper-pagination",
              clickable: true,
            },
          });
        },
      },
      clipboard : function() {
        let clipboardTrigger = document.querySelectorAll('.tyn-copy');
        let options = {
          tooltip:{
            init: 'Copy',
            success : 'Copied',
          }
        }
        clipboardTrigger.forEach(item => {
          //init clipboard
          let clipboard = new ClipboardJS(item);
          //set markup
          let initMarkup = `${options.tooltip.init}`;
          let successMarkup = `${options.tooltip.success}`;
          item.innerHTML = initMarkup;
          //on-sucess
          clipboard.on("success", function(e){
            let target = e.trigger;
            target.innerHTML = successMarkup;
            setTimeout(function(){
              target.innerHTML = initMarkup;
            }, 1000)
          });
        });
      },
      init: function(){
        this.lightbox();
        this.slider.stories();
        this.clipboard();
      }
    };

    TynApp.Custom = {
      init: function(){
        TynApp.Chat.reply.search();
        TynApp.Chat.reply.scroll();
        TynApp.Chat.reply.input();
        TynApp.Chat.reply.quick();
        TynApp.Chat.reply.send();
        TynApp.Chat.item();
        TynApp.Chat.mute();
        TynApp.Chat.aside();
        TynApp.Chat.botsend();
        TynApp.ActiveLink('.tyn-appbar-link', ['active', 'current-page']);
        TynApp.Appbar();
        TynApp.Theme();
      }
    };

    TynApp.Theme = function(){
      // Set Theme Function
      function setMode(currentMode){
        localStorage.setItem('connectme-html', currentMode);
        document.documentElement.setAttribute("data-bs-theme", currentMode);
      }
      // Set Theme On Load
      setMode(localStorage.getItem('connectme-html'));

      var themeModeToggle = document.getElementsByName('themeMode');
      themeModeToggle.forEach((item) =>{
        (item.value == localStorage.getItem('connectme-html')) && (item.checked = true);
        item.addEventListener('change', function(){
            if(item.checked && item.value){
              setMode(item.value);
            }
        })
      })
    }

    TynApp.init = function(){
      TynApp.Load(TynApp.Custom.init.bind(TynApp.Custom));
      TynApp.Load(TynApp.Plugins.init.bind(TynApp.Plugins));
      TynApp.Resize(TynApp.Appbar);
    }

    TynApp.init();

    // Export TynApp to global scope
    global.TynApp = TynApp;
    return TynApp;
})(window);

//end-js
