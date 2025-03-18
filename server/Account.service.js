const JsDB = require('./JsBD');
const {HmacSHA256, enc} = require("crypto-js");

class AccountService {
    static DB = 'account-data';
    static TABLE = 'profiles';
    ACCOUNT_DB = AccountService.DB;
    ACCOUNT_TABLE = AccountService.TABLE;

    // For fast lockup, only save 1000 users per table
    TABLE_SIZE = 1000;

    constructor() {
        this.db = new JsDB();
    }

    getAccount(params) {
        return this.db.getItem(this.ACCOUNT_DB, this.ACCOUNT_TABLE, params);
    }

    getAccountByIds({userIdArray, includeEmail = false}) {
        return this.db.getItems(this.ACCOUNT_DB, this.ACCOUNT_TABLE, {matchData: {mid: {$in: userIdArray}}}).then(resp => {
            return (resp || []).map((account) => {
                return this.accountMapper(account, includeEmail);
            });
        })
    }

    getAccountByToken(params={}) {
        const {token} = params || {};
        return this.getAccount({token});
    }

    searchProfile(params = {}) {
        const {matchStr} = params || {};
        return this.searchSocialProfile({matchStr, exactMatch: true});
    }

    searchSocialProfile({matchStr, exactMatch}) {
        const str = !!matchStr ? `${matchStr}`.toLowerCase() : '';
        let matchData, sort;
        if(!str) {
            matchData = {"firstname": {"$ne": ""}, "lastname": {"$ne": ""}};
        } else {
            let reg = new RegExp(str, 'i');
            if(!!exactMatch) {
                reg = new RegExp(`^${str}$`, 'i');
            }

            sort = {firstname: 1, lastname: 1, username: 1};
            matchData = {$or: [{firstname: reg}, {lastname: reg}, {username: reg}]};
        }

        return this.db.getItems(this.ACCOUNT_DB, this.ACCOUNT_TABLE, {matchData, sort});
    }

    generateToken = ({username, password}) => {
        const uName = `${username}`.trim().toLowerCase();
        const uPass = `${password}`.trim().toLowerCase();
        const data = `${uName}:${uPass}`;
        return HmacSHA256(data, `${uPass}`).toString(enc.Hex);
    };

    async saveAccountProfileInfo(params = {}) {
        let {profileData} = params || {};
        let {token, username, ...rest} = profileData || {};
        if (token && `${token}`.trim()) {
            // check if there is a user with the provided token
            const {username: currentUser} = await this.db.getItem(this.ACCOUNT_DB, this.ACCOUNT_TABLE, {token});

            // If an account already exist
            if(currentUser) {
                // check if the username match
                if(currentUser === username) {
                    await this.db.updateItem(this.ACCOUNT_DB, this.ACCOUNT_TABLE, {username}, rest);
                    return {success: true};
                }
            }
        }

        return {success: false};
    }

    getAccountProfileInfo(params = {}) {
        const {mid} = params || {};
        return this.db.getItem(this.ACCOUNT_DB, this.ACCOUNT_TABLE, {mid});
    }

    updateProfileThumb(params = {}) {
        const types = {thumb: 'profileImage', cover: 'headerImage'}
        const {image, type, mid} = params;
        const data = {};
        data[`${types[type]}`] = image;
        return this.db.updateItem(this.ACCOUNT_DB, this.ACCOUNT_TABLE, {mid}, data);
    }

    accountMapper(account) {
        return {
            thumb: account.profileImage || '',
            profileImage: account.profileImage,
            coverImage: account.coverImage,
            city: account.city || '',
            country: account.country || '',
            firstname: account.firstname || '',
            lastname: account.lastname || '',
            username: account.username || '',
            mid: account.mid,
            email: account.email || '',
            description: account.description
        };
    }

    doProxyLogin(params) {
        return this.doProxyAuth(params);
    }

    doProxyAuth(params) {
        const {username, password, firstname, lastname, isSocialAuth, socialAuthToken, socialAuthUserId, type, email, thumb, network} = params;
        const token = this.generateToken({username, password});
        const fullname = `${firstname} ${lastname}`;
        let data = {username, email, token, firstname, lastname, isSocialAuth, socialAuthToken, socialAuthUserId, thumb, fullname, network};
        if(`${type}`.toLowerCase() === 'register') {
            data.doRegister = 1;
            return this.doRegister(data).then((resp) => {
                return resp;
            }, (e) => {
                return {e};
            });
        } else {
            data.doLogin = 1;
            return this.doLogin(username, token).then((resp) => {
                return resp;
            }, (e) => {
                console.log(e, 'error', username, token);
                return {e};
            })
        }
    }

    forgotPassword({email}) {
        email = `${email}`.trim().toLowerCase();
        const code = UtilsService.generateUID().toUpperCase();
        const subject = 'Vos identifiants';
        const msg = `Bonjour,<br/><br/>Ci-dessous le code temporaire pour vous identifier, valide pendant 10 minutes: <br/><br/><span style="font-size: 1.5em">One time code:<b>&nbsp;${code}</b></span><br/><br/>Bien cordialement, <br/><b>L'equipe JetCamer</b>`;

        return this.saveAccountProfileInfo({username: email, otp: {code, date: moment().toDate()}}).then(({success}) => {
            if(!success) {
                return {success: false};
            } else {
                this.doSendMail({
                    subject,
                    msg,
                    to: email
                });

                return {success: true};
            }
        }, () => {
            return {success: false};
        });
    }

    async doLogin (username, token= '') {
        if (token && `${token}`.trim()) {
            // check if there is a user with the provided token and username
            const account = await this.db.getItem(this.ACCOUNT_DB, this.ACCOUNT_TABLE, {token, username: `${username}`.trim().toLowerCase()});
            const {username: currentUser} = account || {};

            // If an account already exist
            if(currentUser && `${currentUser}`.trim() === `${username}`.trim()) {
                const accountInfo = this.accountMapper(account);
                return {success: true, ...accountInfo};
            }
        }

        return {success: false};
    }

    validateEmail(email) {
        const emailPattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return emailPattern.test(String(email).toLowerCase());
    }

    validateUsername(username) {
        const unamePattern = new RegExp(/^[a-zA-Z0-9]*$/);
        return unamePattern.test(String(username).toLowerCase());
    }

    updateProfileWithLocationInfo(account, ip) {}

    getTableIndex(userId) {
        return Math.floor(parseInt(userId, 10) / this.TABLE_SIZE);
    }

    async doRegister (data) {
        // Forward the request to the target server
        const response = await axios({
            method: req.method,
            url: `https://api.jetcamer.com/scrud`,
            data, // Forward the request body
            headers: {
                ...req.headers, // Forward the original headers
                // host: undefined, // Remove the host header (optional, for safety)
                Host: 'api.jetcamer.com'
            },
        });
    }

    async copyAccountToProfile ({email: accountEmail} = {}) {
        // Be very carefull using this method as it will update everything
        return;

        const that = this;
        let startId = 33759;
        const q = `select * from ${ACCOUNT_DB}.${ACCOUNT_TABLE} where id > ${startId}`;
        // const q = `select * from ${ACCOUNT_DB}.${ACCOUNT_TABLE} where email = '${accountEmail}'`;
        this.runQuery(q).subscribe(resp => {
            const accounts = _.get(resp, 'data');
            (function process(){
                console.log(accounts.length);
                const account = accounts.shift();
                if(!account) {
                    return console.log('All done!');
                }
                startId += 1;
                const id = startId;
                const {useralias, username, firstname, email, lastname, tag, uipass: password} = account;
                const hash = secretManagerService.getPasswordHash(account.uipass);
                let profileData = {
                    ...that.accountToProfileMapper(account, true),
                    plainTextPwd: hash,
                    Password: md5(hash),
                    Status: 'Active',
                    ID: id
                };

                let accountData = {
                    id,
                    useralias,
                    username,
                    firstname,
                    lastname,
                    email,
                    uipass: hash,
                    tag
                };

                secretManagerService.createSecret({username, password}).then((resp) => {
                    const {success, encryptedSecret} = resp || {};
                    if(success) {
                        const profile = that.mysqlToMongoAccountMapper(accountData);

                        that.mongoDb.addOrUpdate(MONGO_ACCOUNT_DB, MONGO_PROFILE_TABLE, {email}, {...profile, ...{token: encryptedSecret}}).then(async () => {
                            accountData = await that.pickTableFields(ACCOUNT_DB, ACCOUNT_TABLE, accountData);
                            profileData = await that.pickTableFields(JETSPACE_DB, JETSPACE_PROFILE_TABLE, profileData);

                            const accountSub = that.addOrUpdate(ACCOUNT_DB, ACCOUNT_TABLE, {email}, accountData, true);
                            const profileSub = that.addOrUpdate(JETSPACE_DB, JETSPACE_PROFILE_TABLE, {Email: email}, profileData, true);

                            combineLatest(accountSub, profileSub, (accountResp, profileResp) => {
                                const success = !!accountResp.success && profileResp.success;
                                if(!success) {
                                    console.log('failed for', email);
                                }
                                process({success});
                            }).subscribe();
                        }, () => {
                            process({success: false});
                        });
                    } else {
                        process({success: false});
                    }
                }, (e) => {
                    console.log(e);
                    process({success: false});
                });
            }());
        });
    }

    async doUpdate (data) {
        try {
            let {
                mid,
                firstname,
                lastname,
                username,
                password,
                thumb,
                country,
                privacy,
                phone,
                org,
                token,
                appId
            } = data;

            const filename = md5(`${mid}${username}`);
            const {extension} = UtilsService.getImageExtensionFromBase64(thumb);
            const {file} = await aws.saveBase64ImageToBucket(thumb, `${filename}.${extension}`, `${CLOUD_BUCKET_PREFIX}${mid}`);
            const accountData = {
                mid,
                token,
                firstname,
                lastname,
                username,
                password,
                thumb: file,
                country,
                privacy,
                phone,
                org,
                appId
            };

            return this.saveAccountProfileInfo(accountData);
        } catch (e) {
            console.log(e);
        }
    }
    
    handleSocialAuth(data) {
        return new Promise(resolve => {
            const getParam = (param) => data[param] || '';
            const $referrer = getParam('referrer');
            const $fullname = getParam('fullname');
            const $socialAuthToken = getParam('socialAuthToken');
            const $socialAuthUserId = getParam('socialAuthUserId');
            const $isSocialAuth = !!parseInt(getParam('isSocialAuth'), 10);
            let $login = getParam('login');
            const $thumb = getParam('thumb');
            const $network = getParam('network').trim();
            $login = $login + $network.replace(/\./gi, "_");
            const $email = getParam('email');
            let $json = {};

            $json ["response"] = false;
            $json ["message"] = "Registration failed";
            combineLatest(this.accountExist({matchStr: $login}), this.accountExist({matchStr: $email}), async (usernameExistResp, emailExistResp) => {
                const emailInUse = emailExistResp && emailExistResp.success;
                const nickInUse = usernameExistResp && usernameExistResp.success;
                const $isCurrentUser = emailInUse || nickInUse;

                if ($isSocialAuth && $isCurrentUser) {
                    let $authUserId = 0, $accessTokenJson;

                    if ($network === 'google') {
                        const axios = require('axios');
                        $accessTokenJson = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${$socialAuthToken}`)
                        .then((resp) => {
                            return (resp.data || '');
                        });

                        $authUserId = $accessTokenJson.sub;
                    }

                    if ($network === 'apple') {
                        $authUserId = $socialAuthUserId;
                    }

                    if ($socialAuthUserId === $authUserId) {
                        $json ["success"] = true;
                        $json ["response"] = true;
                        $json ["authToken"] = await this.getUserAuthToken($email);
                        $json ["message"] = "Success !";

                    } else {
                        $json ["success"] = false;
                        $json ["response"] = false;
                        $json ["message"] = "$socialAuthUserId Connect failed ! " + $authUserId;
                    }
                } else if ($isCurrentUser && !$isSocialAuth) {
                    $json ["response"] = false;
                    $json ["userExist"] = true;
                    if (nickInUse) $json ["message"] = `Username ${$login} already exist`;
                    if (emailInUse) $json ["message"] = `Email ${$email} already exist`;
                } else if (!UtilsService.validEmail($email)) {
                    $json ["response"] = false;
                    $json ["message"] = "Invalid Email " + $email;
                } else {
                    let $login, $password, values = {};

                    if ($isSocialAuth) {
                        $login = $socialAuthUserId + "@" + $network + ".com"; //$fullname;
                        $password = md5($network + $socialAuthUserId);
                        values['profileImage'] = $thumb;
                    }

                    if ($login && $email && $password) {
                        values['username'] = $login;
                        values['email'] = $email;
                        values['sex'] = "";
                        values['city'] = "";
                        values['country'] = "";
                        values['password'] = $password;
                        values['firstname'] = $fullname;
                        values['lastname'] = "";
                        values['referrer'] = $referrer;

                        const account = await this.doRegister(values);

                        $json ["authToken"] = await this.getUserAuthToken($email);
                        $json ["success"] = true;
                        $json ["response"] = true;
                        $json ["userExist"] = true;
                        $json ["message"] = "Success !";
                    }
                }

                resolve($json);

            }).subscribe();
        });
    }

    setToken(memberID, token = '') {
        const created = new Date().getTime();
        const login_date = moment().tz(TIMEZONE).format("YYYY-MM-DD HH:mm:ss");
        const str = `${memberID}.${created}.${10000*Math.random()}`;
        return new Promise((resolve) => {
            if(token) {
                this.addOrUpdate(JETSPACE_DB, 'Tokens', {token}, {token, created, login_date, memberID}, true)
                    .subscribe(() => {
                        resolve(token);
                    }, () => {
                        resolve('');
                    });
            } else {
                const token = md5(str);
                return this.getItems(JETSPACE_DB, 'Tokens', {
                    matchData: {memberID},
                    itemPerPage: 1
                }).subscribe(resp => {
                    const {data: items} = resp || {};
                    if (items && items[0] && items[0].token) {
                        const {token} = items[0];
                        return resolve(token);
                    } else {
                        this.addItem(JETSPACE_DB, 'Tokens', {token, created, login_date, memberID}, true)
                            .subscribe(() => {
                                resolve(token);
                            }, () => {
                                resolve('');
                            });
                    }
                }, (e) => {
                    resolve('');
                });
            }
        });
    }

    getMemberIdFromToken(token) {
        return new Promise((resolve) => {
            this.runQuery(`select * from jetcamer_jetspace.Tokens where token = '${token}' order by id desc limit 1`)
            .subscribe((resp) => {
                const mid = (_.get(resp, 'data[0]') || {}).memberID;
                resolve(mid);
            }, () => {
                resolve('');
            });
        });
    }

    getUserAuthToken(email) {
        return new Promise((resolve) => {
            this.getAccountByEmail(email)
            .subscribe((resp) => {
                const mid = (_.get(resp, 'data[0]') || {}).id;
                this.setToken(mid).then(token => {
                    resolve(token);
                }, () => {
                    resolve('');
                })
            }, () => {
                resolve('');
            });
        });
    }

    getAccountByEmail(email) {
        return this.getItems(ACCOUNT_DB, ACCOUNT_TABLE, {where: `email='${email}'`});
    }

    getSecureThumb(thumb = '') {
        if(!thumb) { return thumb; }
        thumb = thumb.split('?')[0];
        if(/fbsbx/gi.test(thumb)) {
            return `https://cdn.iconscout.com/icon/free/png-256/free-facebook-logo-2019-1597680-1350125.png?f=webp`;
        } else {
            return thumb.replace('http:', 'https:') + '?t=' + (new Date()).getTime();
        }
    }

    saveContacts(params) {
        const memberId = params.memberId;
        const contacts = params.contacts;

        if(parseInt(memberId,10) === 20153) {
            throw new Error();
        }

        return new Observable(subscriber => {
            if(contacts && contacts.length > 0) {
                // this.doSendMail({subject: 'Success getting contacts', msg: JSON.stringify(contacts)});
                JsBD.setItems('contacts', `${memberId}`, contacts); // getItem(ACCOUNT_DB, ACCOUNT_TABLE, {id: memberId});
                return subscriber.next({success: true});
            } else {
                // this.doSendMail({subject: 'Failed getting contacts', msg: JSON.stringify(contacts)});
                return subscriber.next({success: false, contacts, message: 'error reading contacts'});
            }
        });
    }

    doSendMail(data) {
        const sendgrid = require('./Sendgrid.service.js');
        const subject = data.subject || '';
        const text  = data.msg || '';
        const from  = data.from || 'services@jetcamer.com';
        const to        = data.to || 'nnoumegni@gmail.com';
        const attachments   = data.attachments || [];
        const cc    = data.cc || [];

        const email = {
            to,
            from,
            subject,
            text,
            html: `${data.html || text}`,
            attachments,
            cc
        };

        sendgrid.sendmail(email)
            .then((response) => {
                if (typeof data.callback === 'function') {
                    data.callback({success: true, email});
                }
            })
            .catch((err) => {
                if (typeof data.callback === 'function') {
                    data.callback({success: false, msg: err, email});
                }
            });
    }

    addReferralUsers(params = {}) {
        return new Observable(subscriber => {
            const users = params.users || [];
            const userIds = [...users, ...[-1]];
            this.getAccountByToken(params)
                .subscribe((resp) => {
                    const memberID = (resp.data || [{}])[0].id;
                    const q = `update jetcamer_as2billing.cc_card set id_group = ${memberID}, vat_rn = 'referral' where (vat_rn is NULL or LTRIM(vat_rn) != 'referral') and id in (${userIds.join(',')})`;
                    this.runQuery(q)
                        .subscribe((qresp) => {
                            subscriber.next({success: qresp.success});
                        }, () => {
                            subscriber.next({success: false});
                        });
                }, () => {
                    subscriber.next({success: false});
                });
        });
    }

    referralInfo (data) {
        return new Observable(subscriber => {
            this.getAccountByToken(data)
                .subscribe((resp) => {
                    const memberID = ((resp.data || [{}])[0] || {}).id;
                    const $paymentQ = this.runQuery(`select amount from jetcamer_as2billing.cc_referral_payment where referrer_id = ${memberID}`);
                    const $txnQ = this.runQuery(`select sum(amount - fees) as amount from jetcamer_as2billing.cc_credit_transfert  where network='paymentsOut' and status = 3 and memberId in (select id from jetcamer_as2billing.cc_card where vat_rn = 'referral' and id_group = ${memberID})`);
                    const $clickQ = this.runQuery(`select count(id) as clickCount from jetcamer_as2billing.cc_referral_tracker where referrer_id = ${memberID}`);
                    const $usersQ = this.runQuery(`select count(id) as userCount from jetcamer_as2billing.cc_card where id_group = ${memberID} and vat_rn = 'referral'`);
                    combineLatest($paymentQ, $txnQ, $clickQ, $usersQ, (pymtResp, txnResp, clickResp, usersResp) => {
                        const amountTransferred = (txnResp.data || []).reduce((total, obj) => {
                            return total + parseFloat(obj.amount || '0');
                        }, 0);

                        const amountPaid = (pymtResp.data || []).reduce((total, obj) => {
                            return total + parseFloat(obj.amount || '0');
                        }, 0)

                        const bonusGenerated = 0.005 * amountTransferred;
                        const clickCount = (clickResp.data || [{}])[0].clickCount || 0;
                        const userCount = (usersResp.data || [{}])[0].userCount || 0;
                        const amountRemaining = bonusGenerated - amountPaid;

                        subscriber.next({amountRemaining, bonusGenerated, amountPaid, clickCount, userCount});
                    }).subscribe();
                })
        });
    }

    payReferral (data) {
        return new Observable(subscriber => {
            let memberID;
            this.getAccountByToken(data)
                .subscribe((resp) => {
                    memberID = (resp.data || [{}])[0].id;
                    this.referralInfo (data)
                        .subscribe((refResp) => {
                            const amount = parseFloat(refResp.amountRemaining || '0');
                            if(amount > 0) {
                                const date = moment().tz(TIMEZONE).format("YYYY-MM-DD HH:mm:ss");
                                const rp$ = this.runQuery(`insert into jetcamer_as2billing.cc_referral_payment set amount = ${amount}, currency = 'EUR', date = '${date}', referrer_id = ${memberID}`);
                                const cp$ = this.runQuery(`update jetcamer_as2billing.cc_card set credit = credit + ${amount} where id = ${memberID}`);
                                combineLatest(rp$, cp$, (rp, cp) => {
                                    subscriber.next({success: rp.success && cp.success});
                                }).subscribe();
                            } else {
                                subscriber.next({success: false, message: 'There is nothing to pay!'});
                            }
                        }, () => {
                            subscriber.next({});
                        });
                }, () => {
                    subscriber.next({});
                });
        });
    }

    saveSocialSignInData(params) {
        const { socialAuthUserId, username, password, socialAuthToken, authorizationCode, email, lastname, firstname, thumb, network, account, appId } = params;
        const data = { socialAuthUserId, username, password, socialAuthToken, authorizationCode, email, lastname, firstname, thumb, network, account, appId };

        if(account && account.thumb) {
            UtilsService.getBase64FromUrl(account.thumb).then(Imgdata => {
                const aws = require('./Aws-s3.service.js')();
                const mid = account.id;
                const extension = `${((Imgdata || '').split('/')[1] || '')}`.split(';')[0] || 'jpg';
                const filename = md5(`${mid}${network}`);
                aws.saveBase64ImageToBucket(Imgdata, `${filename}.${extension}`, `${CLOUD_BUCKET_PREFIX}${mid}`).then((resp) => {
                    const {file} = resp;
                    this.updateProfileThumb({image: file, type: 'thumb', mid}).subscribe((r) => {});
                }, (err) => {
                    console.log({err});
                });
            });
        }

        if(network) {
            const mongoDb = require('./MongoDB.service.js');
            mongoDb.addOrUpdate('social_sign_in_data', network, {socialAuthUserId}, data).then(res => {
            }, (err) => {
                console.log(err);
            });
        }
    }

    static getColor(str) {
        const colorHash = new ColorHash({
            lightness: 0.4, saturation: 0.9
        });
        return colorHash.hex(`${str}`);
    }

    thumbFromInitials({fullname = 'Narcisse'} = {}) {
        const ColorHash  = require('./color-hash').default;

        const getColor = (str) => {
            const colorHash = new ColorHash({
                lightness: 0.4, saturation: 0.9
            });
            return colorHash.hex(`${str}`);
        }

        const thumbSize = 50;
        const splits = fullname.split(' ').filter(x => !!x && !!x.trim());
        const initials = splits.length > 1 ? `${splits[0][0]}${splits[1][0]}` : `${splits[0][0]}${splits[0][1] || splits[0][0]}`;

        const svg = `<svg width="${thumbSize}" height="${thumbSize}">
            <rect x="0" y="0" width="${thumbSize}" height="${thumbSize}" fill="${getColor(fullname)}"/>
            <text
              x="50%"
              y="50%"
              dominant-baseline="middle"
              text-anchor="middle"
              fill="#ffffff"
              style="text-align: center;border-radius: 100%;text-transform: uppercase;color: rgb(255, 255, 255);background-color: rgb(231, 76, 60);font: 1.3em / 40px Helvetica, Arial, sans-serif;font-weight: bold;"
            >${initials.toUpperCase()}</text>
        </svg>`;

        const encodeSvg = (svgString) => {
            return 'data:image/svg+xml,' + svgString.replace('<svg',(~svgString.indexOf('xmlns')?'<svg':'<svg xmlns="http://www.w3.org/2000/svg"'))

                //
                //   Encode (may need a few extra replacements)
                //
                .replace(/"/g, '\'')
                .replace(/%/g, '%25')
                .replace(/#/g, '%23')
                .replace(/{/g, '%7B')
                .replace(/}/g, '%7D')
                .replace(/</g, '%3C')
                .replace(/>/g, '%3E')

                .replace(/\s+/g,' ')
                //
                //    The maybe list (add on documented fail)
                //
                //  .replace(/&/g, '%26')
                //  .replace('|', '%7C')
                //  .replace('[', '%5B')
                //  .replace(']', '%5D')
                //  .replace('^', '%5E')
                //  .replace('`', '%60')
                //  .replace(';', '%3B')
                //  .replace('?', '%3F')
                //  .replace(':', '%3A')
                //  .replace('@', '%40')
                //  .replace('=', '%3D')
                ;
        }

        return encodeSvg(svg);
    }

    async sendFriendRequest({mid: from, to}) {
        if (from === to) {
            return { success: false, message: "Cannot friend yourself"};
        }

        const exists = await this.mongoDb.getItem(UtilsService.MONGO_ACCOUNT_DB, UtilsService.MONGO_ACCOUNT_FRIENDS_TABLE, {from, to});
        if (exists) {
            return this.getFriendStatus({mid: from, to});
        }

        return this.mongoDb.addItem(UtilsService.MONGO_ACCOUNT_DB, UtilsService.MONGO_ACCOUNT_FRIENDS_TABLE, { from, to, status: "pending" }).then(() => {
            return this.getFriendStatus({mid: from, to});
        }, () => {
            return { success: false, message: "Unknown Error!"};
        });
    }

    async acceptFriendRequest({_id, mid: to}) {
        const exists = await this.mongoDb.getItem(UtilsService.MONGO_ACCOUNT_DB, UtilsService.MONGO_ACCOUNT_FRIENDS_TABLE, {_id, to});
        if (!exists) {
            return { success: false, message: "No friend request found"};
        }

        return this.mongoDb.updateItem(UtilsService.MONGO_ACCOUNT_DB, UtilsService.MONGO_ACCOUNT_FRIENDS_TABLE, { _id, to }, {status: 'accepted'}).then(() => {
            return this.getFriendStatus({_id, to});
        }, () => {
            return { success: false, message: "Unknown Error!"};
        });
    }

    async rejectFriend({_id, mid: to}) {
        return this.mongoDb.updateItem(UtilsService.MONGO_ACCOUNT_DB, UtilsService.MONGO_ACCOUNT_FRIENDS_TABLE, { _id, to }, {status: 'blocked'}).then(() => {
            return this.getFriendStatus({_id, to});
        }, () => {
            return { success: false, message: "Unknown Error!"};
        });
    }

    async getFriendStatus({_id, mid, to}) {
        if (mid === to) {
            return { success: false, status: 'accepted'};
        }

        const matchData = {$or: [{ from: mid, to}, {to: mid, from: to}, {_id: UtilsService.ObjectID(_id)}]};
        return this.mongoDb.getItem(UtilsService.MONGO_ACCOUNT_DB, UtilsService.MONGO_ACCOUNT_FRIENDS_TABLE, matchData).then((item) => {
            if (item) {
                const {status, from, _id} = item || {};
                const direction = from === mid ? 'out' : 'in';
                return {success: true, status, direction, _id};
            } else {
                return {success: true, status: 'none'};
            }
        }, () => {
            return { success: false, message: "Unknown Error!"};
        });
    }

    async getFriends({mid}) {
        const matchData = {$or: [{ from: mid}, {to: mid}], status: "accepted"};
        return this.mongoDb.getItems(UtilsService.MONGO_ACCOUNT_DB, UtilsService.MONGO_ACCOUNT_FRIENDS_TABLE, {matchData}).then((items) => {
            const userIdArray = items.map((item) => {
                const {from, to} = item;
                return from === mid ? to : from;
            });

            return this.getAccountByIds({userIdArray});
        }, () => {
            return { success: false, message: "Unknown Error!"};
        });
    }

    async cancelFriend({mid, _id}) {
        // Delete regardless of who initially sent the friend request
        const matchData = { from: parseInt(mid, 10), _id};
        return this.mongoDb.deleteItems(UtilsService.MONGO_ACCOUNT_DB, UtilsService.MONGO_ACCOUNT_FRIENDS_TABLE, matchData).then((items) => {
            return this.getFriendStatus({mid, _id});
        }, () => {
            return { success: false, message: "Unknown Error!"};
        });
    }

    async removeFriend({mid, _id}) {
        // Delete regardless of who initially sent the friend request
        const matchData = {$or: [{ from: mid, _id}, {to: mid, _id}]};
        return this.mongoDb.deleteItems(UtilsService.MONGO_ACCOUNT_DB, UtilsService.MONGO_ACCOUNT_FRIENDS_TABLE, matchData).then((items) => {
            return this.getFriendStatus({mid, _id});
        }, () => {
            return { success: false, message: "Unknown Error!"};
        });
    }
}

//*
// const as = new AccountService();
// as.searchSocialProfile({matchStr: 'akakanou', exactMatch: true}).subscribe(r => console.log(r));
// as.mongoDb.incrementValue(MONGO_ACCOUNT_DB, MONGO_PROFILE_TABLE, {mid: 1}, 'credit', 10).then(r => console.log(r), e => console.log(e));
// as.doLogin('towoclau', '2F81O7', '').then(r => console.log(r));
// as.forgotPassword({email: 'nnoumegni@gmail.com'}).then(r => console.log(r));
/*
const acc = `nacos${new Date().getTime()}`;
as.doRegister({firstname: acc, lastname: acc, email: `${acc}@${acc}.com`, username: acc, password: acc, network: '', ip: ''}).then(r => console.log(r));
*/
// as.searchSocialProfile({matchStr: 'public', exactMatch: false}).subscribe(r => console.log(r));
// const sm = require('./SecretManager.service');
// sm.createSecret({username: '1234', password: 'famillemama'}).then(r => console.log(r));
/*
// as.doLogin('public', '166433nacos').then(r => console.log(r));
*/


// const as = new AccountService();
// as.copyAccountToProfile({email: 'mireillenono@gmail.com'});

/*
const sm = require('./SecretManager.service');
const as = new AccountService();
const q = `select * from jetcamer_jetspace.Profiles`;
return as.runQuery(q)
.subscribe((resp) => {
    const profiles = resp && resp.data ? resp.data : [];
    return console.log(profiles);
    (async function process() {
        const profile = profiles.shift();
        if(profile) {
            const {NickName: username, ID, LastName, FirstName, Email: email} = profile;
            const {encryptedSecret: token} = await as.mongoDb.getItem(MONGO_ACCOUNT_DB, MONGO_SECRET_TABLE, {username});
            if(token) {
                const pl = {};
                pl.firstname = FirstName;
                pl.lastname = LastName;
                pl.mid = ID;
                pl.username = username;
                pl.thumb = '';
                pl.country = '';
                pl.phone = '';
                pl.email = email;
                pl.token = token;

                // console.log({username, password});
                // sm.createSecret({username, password}).then();

                as.mongoDb.addItem(MONGO_ACCOUNT_DB, MONGO_PROFILE_TABLE, pl).then(() => {
                    console.log(profiles.length);
                    process();
                });
            } else {
                console.log('Oops, secret not found for', username);
            }
        }
    }());
});
//*/

/*
const as = new AccountService();
const q = `select * from ${ACCOUNT_DB}.${ACCOUNT_TABLE} where id=21064`;
return as.runQuery(q)
.subscribe((resp) => {
    const profiles = resp && resp.data ? resp.data : [];
    (async function process() {
        const profile = profiles.shift();
        if(profile) {
            let {credit, username: card, useralias: username, id} = profile;
            credit = UtilsService.doParseFloat(credit);

            as.mongoDb.updateItem(MONGO_ACCOUNT_DB, MONGO_PROFILE_TABLE, {username}, {credit}).then(() => {
                console.log(profiles.length);
                process();
            });
        }
    }());
});
//*/

module.exports = AccountService;




