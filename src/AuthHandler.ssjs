<script runat="server">

Platform.Load("core", "1.1.1");

function AuthHandler() {
    var handler = 'AuthHandler';
    var response = new MiniFrameworkResponse();
    var authBaseUrl = 'https://YOUR_SUBDOMAIN.auth.marketingcloudapis.com/';
    
    function validateConfig(config) {
        if (!config) {
            return response.validationError('config', 'Configuration object is required', handler, 'validateConfig');
        }
        if (!config.clientId) {
            return response.validationError('clientId', 'Client ID is required', handler, 'validateConfig');
        }
        if (!config.clientSecret) {
            return response.validationError('clientSecret', 'Client Secret is required', handler, 'validateConfig');
        }
        if (!config.authBaseUrl) {
            return response.validationError('authBaseUrl', 'Auth Base URL is required', handler, 'validateConfig');
        }
        return null;
    }
    
    function getToken(config) {
        try {
            var validation = validateConfig(config);
            if (validation) {
                return validation;
            }
            
            var tokenUrl = config.authBaseUrl + 'v2/token';
            var postData = {
                'grant_type': 'client_credentials',
                'client_id': config.clientId,
                'client_secret': config.clientSecret
            };
            
            var request = new Script.Util.HttpRequest(tokenUrl);
            request.emptyContentHandling = 0;
            request.retries = 1;
            request.continueOnError = true;
            request.contentType = 'application/json';
            request.method = 'POST';
            request.postData = Stringify(postData);
            
            var httpResponse = request.send();
            
            if (httpResponse.statusCode == 200) {
                var tokenData = Platform.Function.ParseJSON(httpResponse.content);
                if (tokenData && tokenData.access_token) {
                    var tokenInfo = {
                        accessToken: tokenData.access_token,
                        tokenType: tokenData.token_type || 'Bearer',
                        expiresIn: tokenData.expires_in || 3600,
                        restInstanceUrl: tokenData.rest_instance_url,
                        soapInstanceUrl: tokenData.soap_instance_url,
                        obtainedAt: new Date().toISOString()
                    };
                    return response.success(tokenInfo, handler, 'getToken');
                } else {
                    return response.error('TOKEN_PARSE_ERROR', 'Failed to parse token from response', {response: httpResponse.content}, handler, 'getToken');
                }
            } else {
                return response.httpError(httpResponse.statusCode, httpResponse.content, handler, 'getToken');
            }
            
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'getToken');
        }
    }
    
    function refreshToken(config, currentToken) {
        return getToken(config);
    }
    
    function isTokenExpired(tokenInfo, bufferMinutes) {
        try {
            if (!tokenInfo || !tokenInfo.obtainedAt || !tokenInfo.expiresIn) {
                return true;
            }
            
            var buffer = bufferMinutes || 5;
            var obtainedDate = new Date(tokenInfo.obtainedAt);
            var expirationDate = new Date(obtainedDate.getTime() + ((tokenInfo.expiresIn - buffer * 60) * 1000));
            var currentDate = new Date();
            
            return currentDate >= expirationDate;
            
        } catch (ex) {
            return true;
        }
    }
    
    function getValidToken(config, currentToken) {
        try {
            var validation = validateConfig(config);
            if (validation) {
                return validation;
            }
            
            if (!currentToken || isTokenExpired(currentToken)) {
                return getToken(config);
            }
            
            return response.success(currentToken, handler, 'getValidToken');
            
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'getValidToken');
        }
    }
    
    function validateAccess(config, scopes) {
        try {
            var tokenResult = getToken(config);
            if (!tokenResult.success) {
                return tokenResult;
            }
            
            var accessValidation = {
                hasAccess: true,
                tokenValid: true,
                requestedScopes: scopes || [],
                message: 'Access validation completed successfully'
            };
            
            return response.success(accessValidation, handler, 'validateAccess');
            
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'validateAccess');
        }
    }
    
    function createAuthHeader(tokenInfo) {
        try {
            if (!tokenInfo || !tokenInfo.accessToken) {
                return response.validationError('tokenInfo', 'Valid token info is required', handler, 'createAuthHeader');
            }
            
            var authHeader = {
                'Authorization': (tokenInfo.tokenType || 'Bearer') + ' ' + tokenInfo.accessToken,
                'Content-Type': 'application/json'
            };
            
            return response.success(authHeader, handler, 'createAuthHeader');
            
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'createAuthHeader');
        }
    }
    
    return {
        getToken: getToken,
        refreshToken: refreshToken,
        isTokenExpired: isTokenExpired,
        getValidToken: getValidToken,
        validateAccess: validateAccess,
        createAuthHeader: createAuthHeader
    };
}

</script>