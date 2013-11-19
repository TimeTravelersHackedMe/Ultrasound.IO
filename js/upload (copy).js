function PostSeriestoServer() {

var dataString = "ShaLALAALALALALLA";
$.ajax({
    type: "POST",
    url: "newdata.php",
    data: { 'dataString': dataString },
    cache: false,
    success: function()
        {
            alert("Order Submitted");
        }
    });
};
