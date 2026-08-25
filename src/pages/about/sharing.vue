<template>
    <article>
        <h1>Sharing Tournaments</h1>
        <p>
            By default, tournaments are stored locally in your browser. Please note that on
            WebKit-based browsers (e.g. Safari or iOS in general),
            <a href="https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/"
                >local storage is cleared after seven days of inactivity</a
            >, meaning your tournament will be lost if you don't access it within that time frame.
        </p>
        <p>
            bracketeer allows you to share your tournament with others, specifically the match plan
            and scores.
        </p>
        <h2>GitHub Gists</h2>
        <p>
            You can share your tournament state with others through GitHub Gists. The host device
            does not need to be online for others to access the tournament, since the tournament
            state is stored in the Gist. However, please note that Gists are cached by clients for 5
            minutes, meaning that changes made to the tournament may not be immediately visible to
            others. In order to share a tournament via a Gist, you will need to enter a GitHub
            personal access token.
        </p>
        <p>
            You can manage your access tokens in the
            <router-link to="/settings/share/accounts">settings</router-link>.
        </p>
        <h2>Peer-to-Peer</h2>
        <p>
            Peer-to-peer sharing (powered by <a href="https://peerjs.com/">PeerJS</a>) allows you to
            share your tournament state with others in real time. This means that changes made to
            the tournament are immediately visible to all participants. The host device must be
            online and connected to the internet for this to work. No login is required. P2P sharing
            is offered in three modes:
        </p>
        <ul>
            <li>
                <strong>Permanent</strong>: The link is valid whenever the host device is online.
                This means you can safely share the link in advance.
            </li>
            <li>
                <strong>Session</strong>: The link changes whenever the host device reopens the
                browser.
            </li>
            <li>
                <strong>Random</strong>: The link changes whenever the host device reloads or
                reopens the browser.
            </li>
        </ul>
        <h2>Comparing & Combining</h2>
        <table>
            <tbody>
                <tr>
                    <td></td>
                    <th>Gist</th>
                    <th>P2P</th>
                </tr>
                <tr>
                    <th>Free</th>
                    <td>
                        <ion-icon
                            name="checkmark-circle"
                            class="text-green"
                        />
                    </td>
                    <td>
                        <ion-icon
                            name="checkmark-circle"
                            class="text-green"
                        />
                    </td>
                </tr>
                <tr>
                    <th>No login required</th>
                    <td>
                        <ion-icon
                            name="close-circle"
                            class="text-red"
                        />
                        (GitHub)
                    </td>
                    <td>
                        <ion-icon
                            name="checkmark-circle"
                            class="text-green"
                        />
                    </td>
                </tr>
                <tr>
                    <th>Host device can be offline</th>
                    <td>
                        <ion-icon
                            name="checkmark-circle"
                            class="text-green"
                        />
                    </td>
                    <td>
                        <ion-icon
                            name="close-circle"
                            class="text-red"
                        />
                    </td>
                </tr>
                <tr>
                    <th>Changes visible to others</th>
                    <td>After 5 minutes</td>
                    <td>Immediately</td>
                </tr>
                <tr>
                    <th>Link validity</th>
                    <td>Permanent / until gist deleted</td>
                    <td>Depends on mode</td>
                </tr>
            </tbody>
        </table>
        <p>
            <strong>It is recommended to use Gists and P2P sharing together.</strong> Use the Gist
            share link to share the tournament with participants. bracketeer automatically switches
            to P2P sharing when enabled and available. This allows participants to see changes
            immediately, while also allowing them to access the tournament even if the host device
            is currently offline.
        </p>
    </article>
</template>
