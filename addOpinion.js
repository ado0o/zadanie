function processOpnFrmData(event){
    //1.prevent normal event (form sending) processing
    event.preventDefault();

        //2. Read and adjust data from the form (here we remove white spaces before and after the strings)
        var inputs = document.getElementById("form1").elements;
        const nopName = inputs["validationCustomUsername"].value.trim();
        const nopemail = inputs["validemail"].value.trim();
        const imgurl = inputs["inputAddress"].value.trim();
        const commenth = inputs["newcomment"].value.trim();
        const nopWillReturn = inputs["gridCheck"].checked;

        //3. Verify the data
        if(nopName=="" || nopemail=="" || imgurl==""){
            return;
        }

        //3. Add the data to the array opinions and local storage
        const newOpinion =
            {
                name: nopName,
                email: nopemail,
                url: imgurl,
                comment: commenth,
                willReturn: nopWillReturn,
                created: new Date()
            };

        console.log("New opinion:\n "+JSON.stringify(newOpinion));

        opinions.push(newOpinion);

        localStorage.comments = JSON.stringify(opinions);


        //4. Notify the user
       /* window.alert("Your opinion has been stored. Look to the console");
        console.log("New opinion added");
        console.log(opinions);*/

        opinionsElm.innerHTML+=opinion2html(newOpinion);

        //5. Reset the form
        myFrmElm.reset();

}