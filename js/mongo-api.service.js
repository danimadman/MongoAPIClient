var baseUrl = '';
var token = {
    "accessToken": "",
    "refreshToken": "",
    "expiresIn": 0,
    "login": "",
    "expiresDateTime": {}
};
var MongoApi = {
    init: function (url) {
        baseUrl = url;
    },
    getToken: async function () {
        token = Cookies.getJSON("UnivuzApiToken");
        if (token !== undefined && !isNaN(Date.parse(token.expiresDateTime)) && Date.parse(token.expiresDateTime) > Date.now()) {
            return;
        }
        token = token === undefined ? await this.getApiToken() : await this.refreshToken();
    },
    getApiToken: async function () {
        let code = Cookies.get("UnivuzApiCode");
        let login = Cookies.get("UnivuzApiLogin");
        if (code !== undefined) {
            try {
                let result = await this.apiCallback('POST', 'auth/GetTokenByCode', {
                    Login: login,
                    Code: code
                });
                if (result.accessToken !== undefined) {
                    Cookies.set("UnivuzApiToken", result, { path: '/' });
                    token = result;
                }
                return result;
            } catch (error) {
                console.log('Error:', error);
            }
        }
    },
    tryGetToken: async function () {
        if (token === undefined || isNaN(Date.parse(token.expiresDateTime)) || Date.parse(token.expiresDateTime) <= Date.now()) {
            for (var i = 0; i < 5; i++) {
                await UnivuzApi.getToken();
                if (token !== undefined && !isNaN(Date.parse(token.expiresDateTime)) && Date.parse(token.expiresDateTime) > Date.now())
                    break;
            }
            if (token === undefined || Date.parse(token.expiresDateTime) <= Date.now()) {
                showApiNotification("Учетные данные не подтверждены", "Ошибка авторизации", "error");
                return false;
            }
        }

        return true;
    },
    refreshToken: async function () {
        try {
            let result = await this.apiCallback('POST', 'auth/RefreshToken', { RefreshToken: token.refreshToken });
            if (result.accessToken !== undefined) {
                Cookies.set("UnivuzApiToken", result, { path: '/' });
                token = result;
            }
            return result;
        }
        catch (error) {
            await this.getApiToken();
            console.log('Error:', error);
        }
    },
    getHotelRooms: async function () {
        try {
            return await this.apiCallback('GET', `Hotel/Get`, null, 0);
        }
        catch (e) {
            if (e.status == 200)
                return true;

            console.log('Error: ', e);
            return e.responseJSON;
        }
    },
    getDictComfortLevel: async function () {
        try {
            return await this.apiCallback('GET', `Dict/GetDictComfortLevel`, null, 0);
        }
        catch (e) {
            if (e.status == 200)
                return true;

            console.log('Error: ', e);
            return e.responseJSON;
        }
    },
    deleteHotelRoom: async function (id) {
        try {
            return await this.apiCallback('DELETE', `Hotel/Delete/${id}`, null, 0);
        }
        catch (e) {
            if (e.status == 200)
                return true;

            console.log('Error: ', e);
            return e.responseJSON.message;
        }
    },
    postHotelRoom: async function(data) {
        try {
            return await this.apiCallback('POST', `Hotel/Post`, data, 0);
        }
        catch (e) {
            if (e.status == 200)
                return true;

            console.log('Error: ', e);
            return e.responseJSON.message;
        }
    },
    putHotelRoom: async function(data) {
        try {
            return await this.apiCallback('PUT', `Hotel/Update`, data, 0);
        }
        catch (e) {
            if (e.status == 200)
                return true;

            console.log('Error: ', e);
            return e.responseJSON.message;
        }
    },
    getClients: async function () {
        try {
            return await this.apiCallback('GET', `Person/Get`, null, 0);
        }
        catch (e) {
            console.log('Error: ', e);
            return e.responseJSON;
        }
    },
    getClient: async function (id) {
        try {
            return await this.apiCallback('GET', `Person/GetOne/${id}`, null, 0);
        }
        catch (e) {
            console.log('Error: ', e);
            return e.responseJSON;
        }
    },
    postClient: async function (data) {
        try {
            return await this.apiCallbackForm('POST', `Person/Post`, data, 0);
        }
        catch (e) {
            if (e.status == 200)
                return true;

            console.log('Error: ', e);
            return e.responseJSON.message;
        }
    },
    putClient: async function (data) {
        try {
            return await this.apiCallbackForm('PUT', `Person/Update`, data, 0);
        }
        catch (e) {
            if (e.status == 200)
                return true;

            console.log('Error: ', e);
            return e.responseJSON.message;
        }
    },
    deleteClient: async function (id) {
        try {
            return await this.apiCallback('DELETE', `Person/Delete/${id}`, null, 0);
        }
        catch (e) {
            if (e.status == 200)
                return true;

            console.log('Error: ', e);
            return e.responseJSON.message;
        }
    },
    apiCallback: async function (type, method, data, useAuth = 0) {
        if (useAuth == 1)
            await this.getToken();

        return await Promise.resolve($.ajax({
            type: type,
            url: baseUrl + method,
            contentType: "application/json; charset=utf-8",
            dataType: 'json',
            data: (data === null) ? data : JSON.stringify(data),
            beforeSend: function (xhr) {
                if (useAuth == 1)
                    xhr.setRequestHeader("Authorization", "Bearer " + token.accessToken);
            },
            success: function (msg) {
                return msg;
            },
            error: function (xhr, ajaxOptions, thrownError) {
                if (xhr.status == 200)
                    return true;

                console.log(`${xhr.status} ${thrownError}`);
            }
        }));
    },
    apiCallbackForm: async function (type, method, data, useAuth = 0) {
        if (useAuth == 1)
            await this.getToken();

        return await Promise.resolve($.ajax({
            type: type,
            url: baseUrl + method,
            data: data,
            cache: false,
            contentType: false,
            processData: false,
            beforeSend: function (xhr) {
                if (useAuth == 1)
                    xhr.setRequestHeader("Authorization", "Bearer " + token.accessToken);
            },
            success: function (msg) {
                return msg;
            },
            error: function (xhr, ajaxOptions, thrownError) {
                if (xhr.status == 200)
                    return true;

                console.log(`${xhr.status} ${thrownError}`);
            }
        }));
    }
};