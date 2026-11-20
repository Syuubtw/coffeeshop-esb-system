<!DOCTYPE html>
<html>
<head>
    <title>Connecting to Database...</title>
</head>
<body onload="document.forms[0].submit()">
    <p style="font-family: sans-serif; text-align: center; margin-top: 50px;">
        Membuka Database PostgreSQL Coffeeshop...<br>
        <small style="color: #666;">Jika tidak otomatis berpindah, silakan klik tombol di bawah:</small>
    </p>
    <form action="adminer.php?pgsql=127.0.0.1&username=postgres&db=coffeeshop_db" method="post" style="text-align: center;">
        <input type="hidden" name="auth[driver]" value="pgsql">
        <input type="hidden" name="auth[server]" value="127.0.0.1">
        <input type="hidden" name="auth[username]" value="postgres">
        <input type="hidden" name="auth[password]" value="faizsyuhada21">
        <input type="hidden" name="auth[db]" value="coffeeshop_db">
        <input type="hidden" name="auth[permanent]" value="1">
        <button type="submit" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">Buka Database Sekarang</button>
    </form>
</body>
</html>
