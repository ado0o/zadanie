
export default[

    {
        //the part after '#' in the url (so-called fragment):
        hash:"welcome",
        ///id of the target html element:
        target:"articles",
        //the function that returns content to be rendered to the target html element:
        getTemplate: (targetElm) =>
            document.getElementById(targetElm).innerHTML=document.getElementById("main-page").innerHTML
    },

    {
        hash:"articles",
        target: "articles",
        getTemplate: fetchAndDisplayArticles
    },     
    {
        hash:"addOpinion",
        target:"articles",
        getTemplate: createHtml4opinions
    },
    {
        hash:"article",
        target:"articles",
        getTemplate: fetchAndDisplayArticleDetail
    },
    {
        hash:"artEdit",
        target:"articles",
        getTemplate: editArticle
    },     
    {
        hash:"artDelete",
        target:"articles",
        getTemplate: deleteArticle
    },
    {
        hash:"artInsert",
        target:"articles",
        getTemplate: createArticle
    }

];

const urlBase = "https://wt.kpi.fei.tuke.sk/api";
const articlesPerPage = 5;

function createHtml4opinions(targetElm){
    const opinionsFromStorage=localStorage.comments;
    let opinions=[];

    if(opinionsFromStorage){
        opinions=JSON.parse(opinionsFromStorage);
        opinions.forEach(opinion => {
            opinion.created = (new Date(opinion.created)).toDateString();
            opinion.willReturn = opinion.willReturn?"I will return to this page.":"Sorry, one visit was enough.";
        });
    }

    document.getElementById(targetElm).innerHTML = Mustache.render(
        document.getElementById("template-addOpinion").innerHTML,
        opinions
        );
} 


function fetchAndDisplayArticles(targetElm, offsetFromHash, totalCountFromHash){

    let offset=Number(offsetFromHash);
    let totalCount=Number(totalCountFromHash);

    const previewStringLenght=20;

    let urlQuery = "";

    if (offset && totalCount){
        urlQuery=`?offset=${offset}&max=${articlesPerPage}`;
    }else{
        urlQuery=`?max=${articlesPerPage}`;
    }
/*
    if (offset<totalCount) {
        urlQuery.nextPage=`?offset=${offset+1}&max=${articlesPerPage}`;
    }*/

    const url = `${urlBase}/article${urlQuery}`;

    const url1 = "https://wt.kpi.fei.tuke.sk/api/article";

    //let url1 = "https://wt.kpi.fei.tuke.sk/api/article/?max=1&offset=1";

     const articlesElm = document.getElementById("articles");

     let tmpHtmlElm2CreatePreview = document.createElement("div");

     let articleList =[];

    fetch(url)  //there may be a second parameter, an object wih options, but we do not need it now.
    .then(response =>{
        if(response.ok){
            return response.json();
        }else{
            return Promise.reject(new Error(`Failed to access the list of articles. Server answered with ${response.status}: ${response.statusText}.`)); //we return a rejected promise to be catched later
        }
    })
    .then(responseJSON => {
        addArtDetailLink2ResponseJson(responseJSON);
        articleList=responseJSON.articles;
        console.log(JSON.parse(JSON.stringify(articleList)));
        return Promise.resolve();
    })
    .then( ()=> {


        let cntRequests = articleList.map(
            article => fetch(`${url1}/${article.id}`)
        );
        return Promise.all(cntRequests);
    })
    .then(responses => Promise.all(responses.map(resp => resp.json())))
    .then(articles => {
        articles.forEach((article,index) =>{
            tmpHtmlElm2CreatePreview.innerHTML=article.content;
            //articleList[index].content=article.content;
            articleList[index].content=tmpHtmlElm2CreatePreview.textContent.substring(0,previewStringLenght)+"...";
        });
        console.log(JSON.parse(JSON.stringify(articleList)));
        return Promise.resolve();
    })
    .then( () =>{
        articlesElm.innerHTML=Mustache.render(document.getElementById("template-articles").innerHTML,articleList);
    })

}

function addArtDetailLink2ResponseJson(responseJSON){
    responseJSON.articles =
        responseJSON.articles.map(
            article =>(
                {
                    ...article,
                    detailLink:`#article/${article.id}/${responseJSON.meta.offset}/${responseJSON.meta.totalCount}`
                }
            )
        );
}

function fetchAndDisplayArticleDetail(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash) {
    fetchAndProcessArticle(...arguments,false);
}

function fetchAndProcessArticle(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash,forEdit,forDelete,forNew) {
    const url = `${urlBase}/article/${artIdFromHash}`;

    fetch(url)
        .then(response =>{
            if(response.ok){
                return response.json();
            }else{ //if we get server error
                return Promise.reject(new Error(`Server answered with ${response.status}: ${response.statusText}.`));
            }
        })
        .then(responseJSON => {


            if(forEdit){
                responseJSON.formTitle="Article Edit";
                responseJSON.formSubmitCall =
                    `processArtEditFrmData(event,${artIdFromHash},${offsetFromHash},${totalCountFromHash},'${urlBase}')`;
                responseJSON.submitBtTitle="Save article";
                responseJSON.urlBase=urlBase;

                responseJSON.backLink=`#article/${artIdFromHash}/${offsetFromHash}/${totalCountFromHash}`;

                document.getElementById(targetElm).innerHTML =
                    Mustache.render(
                        document.getElementById("template-article-form").innerHTML,
                        responseJSON
                    );
            }else if(forDelete){
              /*  const deletereq={
        method: 'DELETE',
        headers:{
            'Content-Type': 'application/json;charset=utf-8'
        }
    }*/

                document.getElementById(targetElm).innerHTML =
                    Mustache.render(
                        document.getElementById("deleted-art").innerHTML,
                        responseJSON
                    );
            }else if(forNew){
                /*responseJSON.formTitle="New Article";
                responseJSON.formSubmitCall =
                    `processArtEditFrmData(event,${artIdFromHash},${offsetFromHash},${totalCountFromHash},'${urlBase}')`;
                responseJSON.submitBtTitle="Save article";
                responseJSON.urlBase=urlBase;*/

                document.getElementById(targetElm).innerHTML =
                    Mustache.render(
                        document.getElementById("template-article-form").innerHTML,
                        responseJSON
                    );
            }else{


                responseJSON.newLink=`#artInsert/${artIdFromHash}/${offsetFromHash}/${totalCountFromHash}`;
                responseJSON.backLink=`#articles/${offsetFromHash}/${totalCountFromHash}`;
                responseJSON.editLink=`#artEdit/${responseJSON.id}/${offsetFromHash}/${totalCountFromHash}`;
                responseJSON.deleteLink=`#artDelete/${responseJSON.id}/${offsetFromHash}/${totalCountFromHash}`;

                document.getElementById(targetElm).innerHTML =
                    Mustache.render(
                        document.getElementById("template-article").innerHTML,
                        responseJSON
                    );
            }

        })
        .catch (error => { ////here we process all the failed promises
            const errMsgObj = {errMessage:error};
            document.getElementById(targetElm).innerHTML =
                Mustache.render(
                    document.getElementById("template-articles-error").innerHTML,
                    errMsgObj
                );
        });

}

function editArticle(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash) {
    fetchAndProcessArticle(...arguments,true,false);
}
function deleteArticle(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash){
    fetchAndProcessArticle(...arguments,false,true);
}
function createArticle(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash){
    fetchAndProcessArticle(...arguments,false,false,true);
}
