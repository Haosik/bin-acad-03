;
// Global sizes
let winHeight = window.innerHeight;
let bodyScrollTop = 0;

//url1 //api.myjson.com/bins/152f9j
//url2 152f9j.json
class App {
    constructor(url = '//api.myjson.com/bins/152f9j') {
        this.url = url;
        this.data = null;
        this.postsToRender = [];
        this.postsTotal = 0;
        this.renderedPosts = 0;
        this.renderScrollEnabled = true;
        this.searchInputDom = document.getElementById('search');
        this.newsListDom = document.getElementById('news-list');
        this.listOffsetTop = this.newsListDom.offsetTop;
        this.fetchData();
    };

    fetchData() {
        window.fetch(this.url, {
                method: 'get'
            })
            .then(response => response.json())
            .then(data => {
                // Put received posts array into App.data
                this.data = [...data.data];
                this.postsToRender = [...this.data];
                this.postsTotal = this.data.length;
                this.possibleTags = [];
                this.getPossibleTags(this.postsToRender);
                this.currentActiveTags = [];
                this.checkSavedActiveTags();
                this.postsToRender.sort((a, b) => this.sortWithTags(a, b));

                // Init application
                this.renderPosts();
                this.addSearchListener();
                this.addScrollRender();
            })
            .catch(err => {
                console.log(err);
                this.data = 'error';
            });
    };

    sortWithTags(a, b) {
        let count = 0;

        this.currentActiveTags.forEach((el, ind) => {
            if ((a.tags.indexOf(el) >= 0) && (b.tags.indexOf(el) === -1)) {
                count--;
            } else if ((a.tags.indexOf(el) === -1) && (b.tags.indexOf(el) >= 0)) {
                count++;
            };
        });
        if (count === 0) {
            if (Date.parse(a.createdAt) > Date.parse(b.createdAt)) {
                count--;
            } else if (Date.parse(b.createdAt) > Date.parse(a.createdAt)) {
                count++;
            }
        }
        return count;
    };

    getPossibleTags(arr) {
        arr.forEach((elem, ind) => {
            if (elem.tags) {
                (elem.tags).forEach((tag, index) => {
                    if (this.possibleTags.indexOf(tag) == -1) {
                        this.possibleTags.push(tag);
                    }
                })
            }
        })
    };

    checkSavedActiveTags() {
        this.currentActiveTags = [];
        let tagsInStorage = localStorage.getItem('activeTags');
        if (tagsInStorage) {
            for (let tag of this.possibleTags) {
                if (tagsInStorage.indexOf(tag) >= 0) {
                    console.log(tag);
                    this.currentActiveTags.push(tag);
                }
            }
        }
    };

    scrollRenderHandler() {
        bodyScrollTop = window.pageYOffset;

        if (this.newsListDom.innerHTML != "") {
            let lastListChild = this.newsListDom.lastChild;
            let listHeightWithoutOne = (this.newsListDom.clientHeight - lastListChild.clientHeight);

            if (bodyScrollTop >= (listHeightWithoutOne - winHeight)) {
                if (this.renderedPosts < this.postsToRender.length) {
                    this.renderPosts();
                }

            }
        }
    };

    addScrollRender() {
        var self = this;
        window.removeEventListener("scroll", self.scrollRenderHandler.bind(self));
        if (self.renderScrollEnabled === true) {
            window.addEventListener("scroll", self.scrollRenderHandler.bind(self));
        }
    };

    filterList(value) {
        this.newsListDom.innerHTML = "";
        this.postsToRender = [];
        this.renderedPosts = 0;

        if (value == "") {
            this.renderScrollEnabled = true;
            this.postsToRender = [...this.data];
            this.renderPosts();
            return;
        } else {
            this.renderedPosts = 0;
            this.postsToRender = [];
            for (let i = 0; i < this.postsTotal; i++) {

                let itemTitleString = this.data[i].title.toLowerCase();
                // Show posts that satisfy search input's value
                if (itemTitleString.indexOf(value.toLowerCase()) >= 0) {
                    this.postsToRender.push(this.data[i]);
                }
            };
            if (this.postsToRender.length > 0) {
                if (this.postsToRender.length < 10) {
                    let num = this.postsToRender.length;
                    this.renderScrollEnabled = false;
                    this.renderPosts(num, this.postsToRender);
                    return;
                }
                this.renderScrollEnabled = true;
                this.renderPosts();
            } else if (this.postsToRender.length == 0) {
                this.renderedPosts = 0;
                this.postsToRender = [];
                this.newsListDom.innerHTML = "";
                let notFoundMessage = document.createElement('div');
                notFoundMessage.classList.add('not-found-message');
                notFoundMessage.innerHTML = "Sorry, nothing was found :(";
                this.newsListDom.appendChild(notFoundMessage);
            }
        }
    };

    addSearchListener() {
        // Turn on filter input behavior
        if (this.searchInputDom !== undefined) {
            this.searchInputDom.addEventListener('input', (event) => {
                this.filterList(event.target.value);
            });
        };
    };

    // Create and render one post item in DOM
    singlePostRender(item) {
        let listItem = document.createElement('li');
        listItem.classList.add('news-list__item');
        let itemTitle, itemDate, itemFigure, itemFigcaption, itemImg;

        if (item.title) {
            itemTitle = document.createElement('h3');
            itemTitle.classList.add('news-list__title');
            itemTitle.innerHTML = item.title;
        }

        if (item.createdAt) {
            itemDate = document.createElement('div');
            itemDate.classList.add('news-list__date');
            itemDate.innerHTML = item.createdAt;
        }

        if (item.description || item.image) {
            itemFigure = document.createElement('figure');
            itemFigure.classList.add('news-list__figure');
        }

        if (item.description) {
            itemFigcaption = document.createElement('figcaption');
            itemFigcaption.classList.add('news-list__figcaption');
            itemFigcaption.innerHTML = item.description;
        }

        if (item.image) {
            itemImg = document.createElement('img');
            itemImg.classList.add('news-list__img');
            itemImg.src = item.image;
        }

        itemFigure.appendChild(itemFigcaption);
        itemFigure.appendChild(itemImg);

        listItem.appendChild(itemTitle);
        listItem.appendChild(itemDate);
        listItem.appendChild(itemFigure);

        if (item.tags) {
            let tagsList = document.createElement('div');
            tagsList.classList.add('tags-list');
            listItem.appendChild(tagsList);

            (item.tags).forEach((tag, ind) => {
                let tagsLink = document.createElement('button');
                tagsLink.classList.add('tags-link');
                tagsLink.innerHTML = tag;

                if ((this.currentActiveTags).indexOf(tag) >= 0) {
                    tagsLink.classList.add('active');
                }
                tagsList.appendChild(tagsLink);
                tagsLink.addEventListener("click", () => this.activeTagsHandler(tagsLink));
            });
        }
        let closeBtn = document.createElement('button');
        closeBtn.classList.add('close-btn');
        closeBtn.innerHTML = "&#9762;";
        closeBtn.title = "Hide this post";
        listItem.appendChild(closeBtn);
        closeBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.target.closest('.news-list__item').classList.add('js-hidden');
        });

        this.newsListDom.appendChild(listItem);
    };

    // Add and Delete active tags by clicking on them
    activeTagsHandler(element) {
        let clickedTagTxt = element.textContent;
        let clickedTagTLength = clickedTagTxt.length;
        // let getStorageItems = [];
        if (localStorage.getItem('activeTags')) {
            let getStorageItems = localStorage.getItem('activeTags');

            if (getStorageItems === clickedTagTxt) {
                localStorage.removeItem('activeTags');
            } else if (getStorageItems !== clickedTagTxt && getStorageItems.indexOf(clickedTagTxt) >= 0) {
                let clickedTagIndex = getStorageItems.indexOf(clickedTagTxt);
                let currentTags = getStorageItems;
                let firstNewPart = currentTags.slice(0, clickedTagIndex);
                let secondNewPart = currentTags.slice(clickedTagIndex + clickedTagTLength);
                let newActiveTags = firstNewPart.concat(secondNewPart);
                localStorage.setItem('activeTags', newActiveTags);
            } else if (getStorageItems.indexOf(clickedTagTxt) === -1) {
                localStorage.setItem('activeTags', getStorageItems + clickedTagTxt);
            }
        } else {
            localStorage.setItem('activeTags', clickedTagTxt);
        };
        this.checkSavedActiveTags();

        while (this.newsListDom.firstChild) {
            this.newsListDom.removeChild(this.newsListDom.firstChild);
        };

        this.postsToRender.sort((a, b) => this.sortWithTags(a, b));

        this.renderedPosts = 0;
        this.renderPosts(10, this.postsToRender);

    };
    renderPosts(number = 10, arr = this.postsToRender) {
        // Check if all available posts are already rendered
        if (this.renderedPosts >= arr.length) {
            this.renderScrollEnabled = false;
            return;
            // Check if there are less posts aailable to render, than the number
        } else if ((arr.length - this.renderedPosts) < number) {
            number = (this.postsToRender.length - this.renderedPosts);
        };
        //Count number of posts needed to be rendered  and call function to do it
        // console.log((this.renderedPosts + number));

        for (let i = this.renderedPosts; i < (this.renderedPosts + number); i++) {
            let item = arr[i];
            this.singlePostRender(item);
        };

        // Increment App's rendered items counter
        this.renderedPosts += number;

        if (this.renderedPosts >= this.postsToRender.length) {
            this.renderScrollEnabled = false;
        }
    };
};

// Create an instance of application 
const project = new App();
